const vscode = require('vscode');
const path = require('path'); 
const fs = require('fs');

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

        const installationUri = folderUriArr[0];

        // Generate paths to binaries
        const executablesUri = appendPathToURI(installationUri, getExecutablesPath());
        const gccUri = appendPathToURI(executablesUri, getGccPath());
        const gdbUri = appendPathToURI(executablesUri, getGdbPath());
        const makeUri = appendPathToURI(executablesUri, getMakePath());

        const executablesPath = executablesUri.fsPath;
        const gccPath = gccUri.fsPath; 
        const gdbPath = gdbUri.fsPath;
        const makePath = makeUri.fsPath;

        console.log(`Gcc Path: ${gccPath}`);
        console.log(`Gdb Path: ${gdbPath}`);
        console.log(`Make Path: ${makePath}`);

        const replacements = {
            "executablesPath" : executablesPath,
            "makePath" : makePath,
            "gdbPath" : gdbPath,
            "gccPath" : gccPath
        };

        injectSettingsIntoWorkspace(context, replacements);
        injectLaunchConfigurationIntoWorkspace(context, replacements);
        
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


async function injectLaunchConfigurationIntoWorkspace(context, replacements) {
    let launchFile = 'launch.windows.json'

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }

    const launchPath = path.join(context.extensionPath, 'resources', launchFile);
    const launchData = JSON.parse(fs.readFileSync(launchPath, 'utf8'));
    const updatedLaunch = replacePlaceholders(launchData, replacements);

    const config = vscode.workspace.getConfiguration('launch', workspaceFolder.uri);
    const currentConfigs = config.get('configurations') || [];

    currentConfigs.push(updatedLaunch);

    await config.update('configurations', currentConfigs, vscode.ConfigurationTarget.Workspace);
}

/**
 * 
 * @param {vscode.ExtensionContext} context 
 */
async function injectSettingsIntoWorkspace(context, replacements) {
    let settingsFile = 'settings.windows.json';

    const settingsPath = path.join(context.extensionPath, 'resources', settingsFile);
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const updatedSettings = replacePlaceholders(settingsData, replacements);

    // Inject the updated config into VS Code settings
    for (const [key, value] of Object.entries(updatedSettings)) {
        const section = key.split('.')[0];
        const config = vscode.workspace.getConfiguration(section);
        await config.update(key.substring(section.length + 1), value, vscode.ConfigurationTarget.Workspace);
    }
}


function getExecutablesPath() {
    return 'bin';
}

function getGccPath() {
    return 'gcc.exe';
}

function getGdbPath() {
    return 'gdb.exe';
}

function getMakePath() {
    return 'mingw32-make.exe';
}

// -- Auxiliary functions

/**
 * 
 * @param {any} jsonObj 
 * @param {Record<string, string>} replacements 
 * @returns 
 */
function replacePlaceholders(jsonObj, replacements) {
    const jsonStr = JSON.stringify(jsonObj);
    let updatedStr = jsonStr;

    for (const [key, value] of Object.entries(replacements)) {
        const placeholder = `{{${key}}}`;
        updatedStr = updatedStr.replace(new RegExp(placeholder, 'g'), value);
    }

    return JSON.parse(updatedStr);
}

/**
 * @param {vscode.Uri} originalUri
 * @param {any} subpath
 */
function appendPathToURI(originalUri, subpath) {
    return originalUri.with({
        path: originalUri.path.endsWith('/') 
            ? `${originalUri.path}${subpath}`  
            : `${originalUri.path}/${subpath}`  
        });
}

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
