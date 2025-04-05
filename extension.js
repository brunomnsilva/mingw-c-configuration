const vscode = require('vscode');
const path = require('path'); 

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants

const CONFIGURE_C_COMMAND_ID = 'mingw-c-configuration.configure-c';

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// De/Activation Functions 

/**
 * This method is called when the extension is activated.
 * @param {vscode.ExtensionContext} context The extension context provided by VS Code.
 */
function activate(context) {
    
    console.log('Extension "mingw-c-configuration" is now active!');

    
    let disposable = vscode.commands.registerCommand(CONFIGURE_C_COMMAND_ID, async () => {
        
        // Ensure a workspace is open
        if (!ensureWorkspaceOpen()) {
            return;
        }

        // Prompt the user for the installation folder
        const options = {
            canSelectMany: false,
            openLabel: 'Select MinGW Installation Folder',
            canSelectFiles: false,
            canSelectFolders: true
        };

        const folderUriArr = await vscode.window.showOpenDialog(options);

        if (!folderUriArr || folderUriArr.length === 0) {
            vscode.window.showInformationMessage('No folder selected. MinGW configuration cancelled.');
            return; // User cancelled
        }

        const selectedFolderUri = folderUriArr[0];
        const selectedFolderPath = selectedFolderUri.fsPath; 

        console.log(`Folder URI: ${selectedFolderUri}`);
        console.log(`Folder Path: ${selectedFolderPath}`);
        
        // Display a success message box to the user
        vscode.window.showInformationMessage('MinGW Configuration Complete!');
    });

    context.subscriptions.push(disposable);
}

/**
 * This method is called when the extension is deactivated.
 */
function deactivate() {
    console.log('Extension "mingw-c-configuration" is now deactivated.');
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Extension Logic


// -- Auxiliary functions

/**
 * Checks if a workspace is open in the editor.
 * @returns {boolean} True if a workspace is open; false, otherwise.
 */
function ensureWorkspaceOpen() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open. Please open a folder to use this command.');
        return false;
    }

    return true;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Export activate and deactivate functions for VS Code

module.exports = {
    activate,
    deactivate
}
