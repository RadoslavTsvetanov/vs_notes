import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { writeToJSONFile, getConfigPath } from "./utils/config_interacter";
import { PatternType, Pattern, JSON_CONFIG, Entry } from "./utils/types";

// Parse message to extract Entry object
function parseMsg(message: {
  command: string;
  note: string;
  type: PatternType;
  textArray: string[];
  scope: string;
  text: string;
  pattern: string;
}): Entry {
  return {
    note: message.note,
    scope: message.scope.split(",").map((s: string) => s.trim()),
    pattern: {
      type: message.type,
      thingToLookFor: message.pattern,
    },
  };
}

// Read JSON file and extract object
function readJsonFileAndExtractObject(
  context: vscode.ExtensionContext,
  filename: string
): JSON_CONFIG {
  const filePath = path.join(context.extensionUri.fsPath, filename);
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, "");
    } catch (e) {
      console.log(
        e,
        "error is probably ok since we just need to create the file"
      );
    }
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(fileContent);
  } catch (e) {
    return { info: [] };
  }
}

// Get configuration from JSON file
function getConfig(context: vscode.ExtensionContext): JSON_CONFIG {
  return readJsonFileAndExtractObject(context, "config.json");
}

/* 

  @param {entry[]} newEntries - Array of new entries to be added to the config

*/
export function addEntriesToConfig(
  context: vscode.ExtensionContext,
  newEntries: Entry[]
) {
  const config = getConfig(context);
  const newEntriesWithId = newEntries.map((entry) => {
    const newId = Math.floor(Math.random() * 1000000);
    return { ...entry, id: newId };
  });

  const updatedConfig = {
    info: [...config.info, ...newEntriesWithId],
  };

  writeToJSONFile(context, updatedConfig, "config.json");
}

export function addToConfig(
  context: vscode.ExtensionContext,
  newInfo: Entry[]
) {
  writeToJSONFile(context, { info: newInfo }, "config.json");
}

// Restart webview with updated content
function restartWebView(panel: vscode.WebviewPanel, getContent: () => string) {
  panel.webview.html = getContent();
}

function getWebviewContent(
  context: vscode.ExtensionContext,
  elements: Entry[]
): string {
  const configPath = getConfigPath(context);
  const scriptUri = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "script.js"
  );
  const styleUri = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "style.css"
  );
  const scriptSrc = scriptUri.with({ scheme: "vscode-resource" }).toString();
  const styleSrc = styleUri.with({ scheme: "vscode-resource" }).toString();

  let inputsHtml = "";
  elements.forEach((element, index) => {
    let scope = "";
    element.scope.forEach((scopeUnit) => {
      scope += scopeUnit + ",";
    });

    inputsHtml += `
      <div>
        <label for="element${index}">${element.note}</label>
        <input type="text" id="element${index}" class="${element.note}" name="element${index}">
        <p>Scope: ${scope}</p>
        <p>Pattern Type: ${element.pattern.type}</p>
        <p>Pattern: ${element.pattern.thingToLookFor}</p>
        <hr/>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleSrc}" rel="stylesheet">
      <title>Form Example</title>
    </head>
    <body>
      <h1>Text Fields for Array Elements</h1>
      <div>if you wanna view and edit the raw config here is the path: ${configPath} </div>
      <form id="myForm">
        ${inputsHtml}
      </form>
      <h2>Add New Entry</h2>
      <form id="newEntryForm">
        <label for="newNote">Note:</label>
        <input type="text" id="newNote" name="newNote"><br/>
        <label for="newScope">Scope (comma-separated):</label>
        <input type="text" id="newScope" name="newScope"><br/>
        <label for="newPatternType">Pattern Type:</label>
        <select id="newPatternType" name="newPatternType">
          <option value="regex">Regex</option>
          <option value="ai">AI</option>
        </select><br/>
        <label for="newPattern">Pattern:</label>
        <input type="text" id="newPattern" name="newPattern"><br/>
        <button type="button" onclick="addNewEntry()">Add Entry</button>
      </form>
      <script>
        const vscode = acquireVsCodeApi();
        function addNewEntry() {
          const note = document.getElementById('newNote').value;
          const scope = document.getElementById('newScope').value;
          const patternType = document.getElementById('newPatternType').value;
          const pattern = document.getElementById('newPattern').value;
          vscode.postMessage({
            command: 'addNewEntry',
            note: note,
            scope: scope,
            type: patternType,
            pattern: pattern
          });
        }
      </script>
    </body>
    </html>
  `;
}

export function SetUpUI(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("vs.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from VS Code! 4");
  });

  context.subscriptions.push(disposable);

  const disposable_2 = vscode.commands.registerCommand(
    "vs.generateApi",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const uri = document.uri;

        const doc = await vscode.workspace.openTextDocument(uri);
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
          console.log("No workspaces available");

          return;
        }

        const workspaceFolder = workspaceFolders[0].uri.fsPath;
        const filePath = path.join(workspaceFolder, "sampleFile.txt");

        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(
          `API generated for: ${doc.getText()}`
        );
      } else {
        vscode.window.showInformationMessage("No file selected");
      }
    }
  );

  context.subscriptions.push(disposable_2);

  const disposable_3 = vscode.commands.registerCommand(
    "vs.displayInteractablePage",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "interactablePage",
        "Interactable Page",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      let info = getConfig(context).info;
      const filepath = getConfigPath(context);
      panel.webview.html = getWebviewContent(context, info);

      panel.webview.onDidReceiveMessage(
        (message: {
          command: string;
          note: string;
          type: PatternType;
          textArray: string[];
          scope: string;
          text: string;
          pattern: string;
        }) => {
          switch (message.command) {
            case "addNewEntry":
              const newEntry = parseMsg(message);
              info.push(newEntry);
              addToConfig(context, info);
              restartWebView(panel, () =>
                getWebviewContent(context, getConfig(context).info)
              );
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable_3);
}
