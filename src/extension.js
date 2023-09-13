import { window, commands, workspace, ConfigurationTarget } from "vscode";
import { open } from "openurl";
import {
  urlPrefix,
  noSandboxRunning,
  pageNotFound,
  noFileSelected,
  noWorkspaceFolder,
} from "./messages"; // Import the messages file
import { get } from "axios";

/**
 * Check if a web page exists.
 *
 * @param {string} url - The URL of the web page to check.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the page exists, otherwise false.
 */
const checkIfPageExists = async (url) => {
  try {
    const response = await get(url);
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
    await get(url);
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
  window.showErrorMessage(message);
};

/**
 * Open a given URL in the default web browser.
 *
 * @param {string} url - The URL to open.
 */
const openUrl = async (url) => {
  const isSandboxRunning = await checkIfSandboxIsRunning(urlPrefix);

  if (!isSandboxRunning) {
    showError(noSandboxRunning);
    return;
  }

  const doesPageExist = await checkIfPageExists(url);

  if (!doesPageExist) {
    showError(pageNotFound);
    return;
  }

  open(url);
};

/**
 * Register the extension command
 * @param {vscode.ExtensionContext} context
 */
const registerCommand = (context) => {
  let disposable = commands.registerCommand(
    "open-with-url-prefix.open",
    (fileUri) => {
      if (!fileUri) {
        showError(noFileSelected);
        return;
      }

      const workspaceFolder = workspace.getWorkspaceFolder(fileUri);

      if (!workspaceFolder) {
        showError(noWorkspaceFolder);
        return;
      }

      const fileRelativePath = workspace.asRelativePath(fileUri, false);
      const file = fileRelativePath.replace(/(^|.*\/)(app-sandbox|app)\//, "");

      const url = `${urlPrefix}${file}`;

      openUrl(url);
    },
  );

  context.subscriptions.push(disposable);
};

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context
 */
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const isFirstRun = context.globalState.get("isFirstRun", true);

  if (isFirstRun) {
    // This is the first time the extension has been run
    context.globalState.update("isFirstRun", false);

    const editorConfig = workspace.getConfiguration("editor");
    const workbenchConfig = workspace.getConfiguration(
      "workbench.colorCustomizations",
    );

    if (!editorConfig.get("bracketPairColorization.enabled")) {
      window
        .showInformationMessage(
          "Would you like to enable custom settings for bracket pair colorization?",
          "Yes",
          "No",
        )
        .then((selection) => {
          if (selection === "Yes") {
            editorConfig.update(
              "bracketPairColorization.enabled",
              true,
              ConfigurationTarget.Global,
            );
            // Also set color customizations
            workbenchConfig.update(
              "editorBracketHighlight.foreground1",
              "#5caeef",
              ConfigurationTarget.Global,
            );
            workbenchConfig.update(
              "editorBracketHighlight.foreground2",
              "#dfb976",
              ConfigurationTarget.Global,
            );
            workbenchConfig.update(
              "editorBracketHighlight.foreground2",
              "#c172d9",
              ConfigurationTarget.Global,
            );
            workbenchConfig.update(
              "editorBracketHighlight.foreground2",
              "#4fb1bc",
              ConfigurationTarget.Global,
            );
            workbenchConfig.update(
              "editorBracketHighlight.foreground2",
              "#97c26c",
              ConfigurationTarget.Global,
            );
            workbenchConfig.update(
              "editorBracketHighlight.foreground2",
              "#abb2c0",
              ConfigurationTarget.Global,
            );
            workbenchConfig.update(
              "editorBracketHighlight.unexpectedBracket.foreground",
              "#db6165",
              ConfigurationTarget.Global,
            );
          }
        });
    }
  }
  registerCommand(context);
}

/**
 * Deactivate the extension
 */
const deactivate = () => {};

export default {
  activate,
  deactivate,
};
