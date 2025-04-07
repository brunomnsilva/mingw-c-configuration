
## MinGW C Configuration

### Description

Automatically injects MinGW build and debug configurations into the current VS Code workspace and creates a PowerShell terminal profile with the MinGW installation path set.

The extension is intended for **Windows only**.

Its very useful when:

- You are having problems with your *system environment variables* when using MinGW;
- You wish to have MinGW installed on a USB pen, e.g., you don't have administrative rights on the machine you're developing in.
 
### Features

- Prompts the user for a MinGW installation folder;

- Adds a PowerShell terminal profile with MinGW path and `make` *alias*, so you can use `gcc`, `gdb` and `make` directly;
- Sets up the *workspace* configuration `.vscode` folder with:
  - `tasks.json` and `launch.json` to *debug* the program through VS Code UI;
  - `c_cpp_properties.json` that is required for the C/C++ extension (`ms-vscode.cpptools`) to configure *intellisense* in the editor.


### Commands

> **Create or Update MinGW Configuration for C Language**

 Prompts the user for the MinGW installation folder and then performs the necessary updates to the workspace configuration folders.

 (TODO: add animated gif)


### Example `launch.json` Template

```json
{
    "name": "Debug project (MinGW)",
    "type": "cppdbg",
    "request": "launch",
    "program": "${workspaceFolder}\\prog.exe", 
    "args": [],
    "stopAtEntry": false,
    "cwd": "${workspaceFolder}",
    "environment": [],
    "MIMode": "gdb",
    "externalConsole": false,
    "setupCommands": [
        {
            "description": "Enable pretty-printing for gdb",
            "text": "-enable-pretty-printing",
            "ignoreFailures": true
        }
    ],
    "preLaunchTask": "Make debug (MinGW)",
    "miDebuggerPath": "{{gdbPath}}"            
}
```

where `{{gdbPath}}` is replaced with the `gdb` path of the prompted installation folder.

### Limitations and Known Issues

The `makefile` of your C project should produce an executable called `prog.exe` for the configuration provided by the extension to work without any modification.

### Extension Settings

The extension does not use any settings at the moment.

### How to Contribute

1. **Fork** the repository on GitHub: [https://github.com/brunomnsilva/mingw-c-configuration](https://github.com/brunomnsilva/mingw-c-configuration)

2. **Clone** the repository to your local machine:

   ```bash
   git clone https://github.com/brunomnsilva/mingw-c-configuration.git
   ```

3. **Install dependencies**:

   - Make sure you have [Node.js](https://nodejs.org/) installed.
   - Inside the project directory, run:

     ```bash
     npm ci
     ```

4. **Run and test** the extension in VS Code:

   - Press `F5` to open a new VS Code window with the extension loaded.
   - Test the functionality by using the "Create or Update MinGW Configuration for C Language" command.

5. Make a pull request.

### Author

[Bruno Silva](https://github.com/brunomnsilva)

### License

This extension releases under the **[MIT License](./LICENSE)**.