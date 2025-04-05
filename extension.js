const vscode = require('vscode');

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
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open. Please open a folder to use this command.');
            return;
        }

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from MinGW C Configuration!');
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

// TODO

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Export activate and deactivate functions for VS Code

module.exports = {
    activate,
    deactivate
}
