import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

function parseMsg(message: {
  command: string;
  note: string;
  type: PattrenType;
  textArray: string[];
  scope: string;
  text: string;
  pattern: string;
}) {
  return {
    note: message.note,
    scope: message.scope.split(",").map((s: string) => s.trim()),
    pattern: {
      type: message.type,
      thingToLookFor: message.pattern,
    },
  };
}
enum PattrenType {
  regex = "regex",
  ai = "ai",
}
interface Pattern {
  type: PattrenType;
  thingToLookFor: string;
}

interface Entry {
  note: string;
  scope: string[];
  pattern: Pattern;
}

type JSON_CONFIG = { info: Entry[] };

function writeToJSONFile(
  context: vscode.ExtensionContext,
  object: object,
  filename: string
) {
  fs.writeFileSync(
    path.join(context.extensionUri.fsPath, filename),
    JSON.stringify(object)
  );
}

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

function getConfig(context: vscode.ExtensionContext): JSON_CONFIG {
  return readJsonFileAndExtractObject(context, "config.json");
}

function addToConfig(context: vscode.ExtensionContext, newInfo: Entry[]) {
  writeToJSONFile(context, { info: newInfo }, "config.json");
}

function restartWebView(panel: vscode.WebviewPanel, getContent: () => string) {
  panel.webview.html = getContent();
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vs" is now active!');
}

export function deactivate() {}

function getWebviewContent(
  extensionUri: vscode.Uri,
  elements: Entry[]
): string {
  const scriptUri = vscode.Uri.joinPath(extensionUri, "media", "script.js");
  const styleUri = vscode.Uri.joinPath(extensionUri, "media", "style.css");
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
        <p>scope: ${scope}</p>
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
      <form id="myForm">
        ${inputsHtml}
      </form>
      <h2>Add New Entry</h2>
      <form id="newEntryForm">
        <label for="newNote">Note:</label>
        <input type="text" id="newNote" name="newNote">
        <label for="newScope">Scope (comma-separated):</label>
        <input type="text" id="newScope" name="newScope">
        <button type="button" onclick="addNewEntry()">Add Entry</button>
      </form>
      <script>
        const vscode = acquireVsCodeApi();
        function addNewEntry() {
          const note = document.getElementById('newNote').value;
          const scope = document.getElementById('newScope').value;
          vscode.postMessage({
            command: 'addNewEntry',
            note: note,
            scope: scope
          });
        }
      </script>
    </body>
    </html>
  `;
}

export function SetUpUI(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("vs.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from vs code! 4");
  });

  context.subscriptions.push(disposable);

  let disposable_2 = vscode.commands.registerCommand(
    "vs.generateApi",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const uri = document.uri;

        const doc = await vscode.workspace.openTextDocument(uri);
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
          throw new Error("No workspaces available");
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

  let dis_3 = vscode.commands.registerCommand(
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
      panel.webview.html = getWebviewContent(context.extensionUri, info);

      panel.webview.onDidReceiveMessage(
        (message: {
          command: string;
          note: string;
          type: PattrenType;
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
                getWebviewContent(context.extensionUri, getConfig(context).info)
              );
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(dis_3);
}
