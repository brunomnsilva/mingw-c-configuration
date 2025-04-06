const vscode = require('vscode');
const path = require('path'); 
const fs = require('fs');
const fsPromises = require('fs/promises');
const url = require('url')

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants

const CONFIGURE_C_COMMAND_ID = 'mingw-c-configuration.configure-c';

const PATH_EXECUTABLES = 'bin';
const PATH_GCC = 'gcc.exe';
const PATH_GDB = 'gdb.exe';
const PATH_MAKE = 'mingw32-make.exe';

const TEMPLATE_SETTINGS_JSON = 'settings.windows.json';
const TEMPLATE_LAUNCH_JSON = 'launch.windows.json';
const TEMPLATE_TASKS_JSON = 'tasks.windows.json';
const TEMPLATE_CPROPERTIES_JSON = 'c_cpp_properties.json';

const PLACEHOLDER_EXECUTABLES = 'executablesPath';
const PLACEHOLDER_GCC = 'gccPath';
const PLACEHOLDER_GDB = 'gdbPath';
const PLACEHOLDER_MAKE = 'makePath';

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

        // Make sure .vscode folder exists beforehand, otherwise it is created.
        await ensureVscodeFolderExists();

        const installationUri = folderUriArr[0];

        // Generate required paths for mingw configuration
        const executablesUri = appendPathToURI(installationUri, PATH_EXECUTABLES);
        const gccUri = appendPathToURI(executablesUri, PATH_GCC);
        const gdbUri = appendPathToURI(executablesUri, PATH_GDB);
        const makeUri = appendPathToURI(executablesUri, PATH_MAKE);

        const executablesPath = uriToFilepath(executablesUri);
        const gccPath = uriToFilepath(gccUri); 
        const gdbPath = uriToFilepath(gdbUri);
        const makePath = uriToFilepath(makeUri);

        console.log(`MinGW C Configuration - Paths: ${executablesPath}; ${gccPath}; ${gdbPath};${makePath}`);

        const replacements = {
            [PLACEHOLDER_EXECUTABLES] : executablesPath,
            [PLACEHOLDER_MAKE] : makePath,
            [PLACEHOLDER_GDB] : gdbPath,
            [PLACEHOLDER_GCC] : gccPath
        };

        try {
            injectSettingsIntoWorkspace(context, replacements);
            injectTasksConfigurationIntoWorkspace(context, replacements);
            injectLaunchConfigurationIntoWorkspace(context, replacements);
            injectCPropertiesIntoWorkspace(context, replacements);
            
            // Display a success message box to the user
            vscode.window.showInformationMessage('MinGW configuration completed!');
        } catch (err) {
            console.error(err.stack);
            vscode.window.showErrorMessage('MinGW configuration failed! See extension log.');
        }
        
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

/**
 * Injects updated tasks.json contents into the workspace settings by replacing placeholders 
 * with the provided values.
 * 
 * This function reads a settings JSON file (`tasks.windows.json`), replaces 
 * placeholders with values from the `replacements` object, and updates the 
 * corresponding VS Code tasks.json contents for the current workspace.
 * 
 * @param {vscode.ExtensionContext} context - The extension context, used to access the extension's path.
 * @param {Object} replacements - An object containing placeholder replacements for the template.
 */
async function injectTasksConfigurationIntoWorkspace(context, replacements) {
    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    const tasksPath = path.join(context.extensionPath, 'resources', TEMPLATE_TASKS_JSON);
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    const updatedTasks = replacePlaceholders(tasksData, replacements);

    const config = vscode.workspace.getConfiguration('tasks', workspaceFolder.uri);
    const currentConfigs = config.get('tasks') || [];

    const alreadyExists = currentConfigs.some(conf => conf.label === updatedTasks.label);

    if (alreadyExists) {
        // Replace our configuration if it already exists
        const updatedConfigs = [
            ...currentConfigs.filter(conf => conf.name !== updatedTasks.name),
            updatedTasks
        ];
        await config.update('tasks', updatedConfigs, vscode.ConfigurationTarget.Workspace);     
    } else {
        // Push our configuration
        currentConfigs.push(updatedTasks);
        await config.update('tasks', currentConfigs, vscode.ConfigurationTarget.Workspace);
    }
}

/**
 * Injects updated launch.json contents into the workspace settings by replacing placeholders 
 * with the provided values.
 * 
 * This function reads a settings JSON file (`launch.windows.json`), replaces 
 * placeholders with values from the `replacements` object, and updates the 
 * corresponding VS Code launch.json contents for the current workspace.
 * 
 * @param {vscode.ExtensionContext} context - The extension context, used to access the extension's path.
 * @param {Object} replacements - An object containing placeholder replacements for the template.
 */
async function injectLaunchConfigurationIntoWorkspace(context, replacements) {
    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    const launchPath = path.join(context.extensionPath, 'resources', TEMPLATE_LAUNCH_JSON);
    const launchData = JSON.parse(fs.readFileSync(launchPath, 'utf8'));
    const updatedLaunch = replacePlaceholders(launchData, replacements);

    const config = vscode.workspace.getConfiguration('launch', workspaceFolder.uri);
    const currentConfigs = config.get('configurations') || []; 

    const alreadyExists = currentConfigs.some(conf => conf.name === updatedLaunch.name);

    if (alreadyExists) {
        // Replace our configuration if it already exists
        const updatedConfigs = [
            ...currentConfigs.filter(conf => conf.name !== updatedLaunch.name),
            updatedLaunch
        ];
        await config.update('configurations', updatedConfigs, vscode.ConfigurationTarget.Workspace);    
    } else {
        // Push our configuration
        currentConfigs.push(updatedLaunch);
        await config.update('configurations', currentConfigs, vscode.ConfigurationTarget.Workspace);
    }
}

/**
 * Injects updated settings into the workspace settings by replacing placeholders 
 * with the provided values.
 * 
 * This function reads a settings JSON file (`settings.windows.json`), replaces 
 * placeholders with values from the `replacements` object, and updates the 
 * corresponding VS Code settings for the current workspace.
 * 
 * @param {vscode.ExtensionContext} context - The extension context, used to access the extension's path.
 * @param {Object} replacements - An object containing placeholder replacements for various settings.
 */
async function injectSettingsIntoWorkspace(context, replacements) {
    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    const settingsPath = path.join(context.extensionPath, 'resources', TEMPLATE_SETTINGS_JSON);
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const updatedSettings = replacePlaceholders(settingsData, replacements);

    // Inject the updated config into VS Code settings
    for (const [key, value] of Object.entries(updatedSettings)) {
        const section = key.split('.')[0];
        const config = vscode.workspace.getConfiguration(section);
        await config.update(key.substring(section.length + 1), value, vscode.ConfigurationTarget.Workspace);
    }
    
}

async function injectCPropertiesIntoWorkspace(context, replacements) {

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    const propertiesPath = path.join(context.extensionPath, 'resources', TEMPLATE_CPROPERTIES_JSON);
    const propertiesData = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
    const updatedSettings = replacePlaceholders(propertiesData, replacements);

    const wsPropertiesPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'c_cpp_properties.json');

    await fsPromises.writeFile(wsPropertiesPath, JSON.stringify(updatedSettings, null, 4), 'utf-8');
}


// -- Auxiliary functions

/**
 * Converts an .
 * @param {vscode.Uri} path
 */
function uriToFilepath(path) {
    return JSON.stringify(url.fileURLToPath(new URL(path))).slice(1, -1);
}

/**
 * Replaces placeholders in the given JSON configuration object with the provided values.
 * @param {any} jsonObj 
 * @param {Record<string, string>} replacements 
 * @returns {object}
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
 * Appends a subpath to a given Uri.
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
 * Ensure the .vscode folder exists in the current workspace
 */
async function ensureVscodeFolderExists() {
    const vscodeFolderPath = path.join(
        vscode.workspace.workspaceFolders[0].uri.fsPath,
        '.vscode'
    );

    await fsPromises.mkdir(vscodeFolderPath, { recursive: true });
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
