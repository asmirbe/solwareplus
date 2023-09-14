const vscode = require("vscode");
const openurl = require("openurl");
const messages = require("./messages"); // Import the messages file
const axios = require("axios");

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
	const isSandboxRunning = await checkIfSandboxIsRunning(messages.urlPrefix);

	if (!isSandboxRunning) {
		showError(messages.noSandboxRunning);
		return;
	}

	const doesPageExist = await checkIfPageExists(url);

	if (!doesPageExist) {
		showError(messages.pageNotFound);
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
			showError(messages.noFileSelected);
			return;
		}

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

		if (!workspaceFolder) {
			showError(messages.noWorkspaceFolder);
			return;
		}

		const fileRelativePath = vscode.workspace.asRelativePath(fileUri, false);
		const file = fileRelativePath.replace(/(^|.*\/)(app-sandbox|app)\//, "");

		const url = `${messages.urlPrefix}${file}`;

		openUrl(url);
	});

	context.subscriptions.push(disposable);
};

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
	registerCommand(context);
};

/**
 * Deactivate the extension
 */
const deactivate = () => {};

module.exports = {
	activate,
	deactivate,
};