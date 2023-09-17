const vscode = require("vscode");
const openurl = require("openurl");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const msg = require("./messages").messages;
const uuid = require("uuid");

/**
 * Check if a web page exists.
 *
 * @param {string} url - The URL of the web page to check.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the page exists, otherwise false.
 */
const checkIfPageExists = async (url) => {
	try {
		const response = await axios.get(url);
		// If status code is 200, the page exists
		return response.status === 200;
	} catch (error) {
		// If we receive an error, it could be a network error, or a 404, or another HTTP error
		// so we assume the page doesn't exist.
		console.log(`Failed to fetch the page`);
		return false;
	}
};

/**
 * Checks if the sandbox server is running at the given URL.
 *
 * @param {string} url - The URL to check.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the server is running, otherwise false.
 */
const checkIfSandboxIsRunning = async (url) => {
	try {
		await axios.get(url);
		return true;
	} catch (error) {
		console.log("Server is not running");
		return false;
	}
};

/**
 * Show an error message using the vscode window.
 *
 * @param {string} message - The error message to display.
 */
const showError = (message) => {
	vscode.window.showErrorMessage(message);
};

/**
 * Open a given URL in the default web browser.
 *
 * @param {string} url - The URL to open.
 */
const openUrl = async (url) => {
	const isSandboxRunning = await checkIfSandboxIsRunning(msg.urlPrefix);

	if (!isSandboxRunning) {
		showError(msg.noSandboxRunning);
		return;
	}

	const doesPageExist = await checkIfPageExists(url);

	if (!doesPageExist) {
		showError(msg.pageNotFound);
		return;
	}

	openurl.open(url);
};

/**
 * Register the extension command
 * @param {vscode.ExtensionContext} context
 */
const registerCommand = (context) => {
	let disposable = vscode.commands.registerCommand("open-with-url-prefix.open", (fileUri) => {
		if (!fileUri) {
			showError(msg.noFileSelected);
			return;
		}

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

		if (!workspaceFolder) {
			showError(msg.noWorkspaceFolder);
			return;
		}

		const fileRelativePath = vscode.workspace.asRelativePath(fileUri, false);
		const file = fileRelativePath.replace(/(^|.*\/)(app-sandbox|app)\//, "");

		const url = `${msg.urlPrefix}${file}`;

		openUrl(url);
	});

	context.subscriptions.push(disposable);
};

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
	const appDir = path.dirname(require.main.filename);
	const base = path.join(appDir, "vs", "code");
	const htmlFile = path.join(base, "electron-sandbox", "workbench", "workbench.html");
	const BackupFilePath = (uuid) => path.join(base, "electron-sandbox", "workbench", `workbench.${uuid}.bak-custom-css`);

	// ####  main commands ######################################################

	async function cmdInstall() {
		const uuidSession = uuid.v4();
		await createBackup(uuidSession);
		await performPatch(uuidSession);
	}

	async function cmdReinstall() {
		await uninstallImpl();
		await cmdInstall();
	}

	async function cmdUninstall() {
		await uninstallImpl();
		disabledRestart();
	}

	async function uninstallImpl() {
		const backupUuid = await getBackupUuid(htmlFile);
		if (!backupUuid) return;
		const backupPath = BackupFilePath(backupUuid);
		await restoreBackup(backupPath);
		await deleteBackupFiles();
	}

	// #### Backup ################################################################

	async function getBackupUuid(htmlFilePath) {
		try {
			const htmlContent = await fs.promises.readFile(htmlFilePath, "utf-8");
			const m = htmlContent.match(/<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ([0-9a-fA-F-]+) !! -->/);
			if (!m) return null;
			else return m[1];
		} catch (e) {
			vscode.window.showInformationMessage(msg.somethingWrong + e);
			throw e;
		}
	}

	async function createBackup(uuidSession) {
		try {
			let html = await fs.promises.readFile(htmlFile, "utf-8");
			html = clearExistingPatches(html);
			await fs.promises.writeFile(BackupFilePath(uuidSession), html, "utf-8");
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function restoreBackup(backupFilePath) {
		try {
			if (fs.existsSync(backupFilePath)) {
				await fs.promises.unlink(htmlFile);
				await fs.promises.copyFile(backupFilePath, htmlFile);
			}
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function deleteBackupFiles() {
		const htmlDir = path.dirname(htmlFile);
		const htmlDirItems = await fs.promises.readdir(htmlDir);
		for (const item of htmlDirItems) {
			if (item.endsWith(".bak-custom-css")) {
				await fs.promises.unlink(path.join(htmlDir, item));
			}
		}
	}

	// #### Patching ##############################################################

	async function performPatch(uuidSession) {
		if (!uuidSession) {
			console.log("UUID session is not valid.");
			return;
		}
		console.log("UUID Session:", uuidSession);
		let html = await fs.promises.readFile(htmlFile, "utf-8");
		html = clearExistingPatches(html);

		const injectHTML = await patchHtml();
		html = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, "");

		html = html.replace(/(<\/html>)/, `<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ${uuidSession} !! -->\n` + "<!-- !! VSCODE-CUSTOM-CSS-START !! -->\n" + injectHTML + "<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n</html>");
		console.log(`uuidSession: ${uuidSession}`);
		console.log(`injectHTML: ${injectHTML}`);
		try {
			await fs.promises.writeFile(htmlFile, html, "utf-8");
		} catch (e) {
			vscode.window.showInformationMessage("Admin");
			disabledRestart();
		}
		enabledRestart();
	}
	function clearExistingPatches(html) {
		html = html.replace(/<!-- !! VSCODE-CUSTOM-CSS-START !! -->[\s\S]*?<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n*/, "");
		html = html.replace(/<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID [\w-]+ !! -->\n*/g, "");
		return html;
	}

	async function patchHtml() {
		try {
			const imp = await patchHtmlForItem();
			console.log(imp);
			return imp;
		} catch (e) {
			console.error(e);
			return "";
		}
	}
	async function patchHtmlForItem() {
		return `<style>
				.part.editor>.content .grid-view-container .overflow-guard .margin-view-overlays .current-line {
					border-left: 4px solid #50fa7b;
					background: rgb(116, 207, 136, 0.1);
				}
				.title.tabs.show-file-icons::before {
					content: '';
					width: 100%;
					height: 1px;
					position: absolute;
					bottom: 0;
					background: #2c2c2c;
					z-index: 999;
			}
				.tabs-container .tab-border-bottom-container {
					display: none !important;
				}
				.monaco-list.list_id_2.mouse-support.last-focused.selection-none:focus-within {
					outline: none !important;
				}
		</style>`;
	}

	function reloadWindow() {
		// reload vscode-window
		vscode.commands.executeCommand("workbench.action.reloadWindow");
	}
	function enabledRestart() {
		vscode.window.showInformationMessage(msg.enabled, { title: msg.restartIde }).then(reloadWindow);
	}
	function disabledRestart() {
		vscode.window.showInformationMessage(msg.disabled, { title: msg.restartIde }).then(reloadWindow);
	}

	const installCustomCSS = vscode.commands.registerCommand("extension.installCustomCSS", cmdInstall);
	const uninstallCustomCSS = vscode.commands.registerCommand("extension.uninstallCustomCSS", cmdUninstall);
	const updateCustomCSS = vscode.commands.registerCommand("extension.updateCustomCSS", cmdReinstall);

	context.subscriptions.push(installCustomCSS);
	context.subscriptions.push(uninstallCustomCSS);
	context.subscriptions.push(updateCustomCSS);

	console.log("vscode-custom-css is active!");
	console.log("Application directory", appDir);
	console.log("Main HTML file", htmlFile);
	registerCommand(context);
};

/**
 * Deactivate the extension
 */
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
