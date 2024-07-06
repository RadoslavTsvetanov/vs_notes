import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

// Function to read JSON file and extract object
function readJsonAndExtractObject(filename: string): any {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    throw new Error("No workspace is open");
  }

  const workspaceFolder = workspaceFolders[0].uri.fsPath;
  const filePath = path.join(workspaceFolder, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContent);
}

function getConfig() {
  return readJsonAndExtractObject("config.json");
}

function restartWebView(panel: vscode.WebviewPanel, getContent: () => string) {
  panel.webview.html = getContent();
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vs" is now active!');

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
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(filePath),
          Buffer.from("hihihihihihihi", "utf8")
        );
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

      let info: string[] = ["koko"];
      panel.webview.html = getWebviewContent(context.extensionUri, info);

      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "saveAndReload":
              restartWebView(panel, () =>
                getWebviewContent(context.extensionUri, info)
              );
              return;

            case "new_info":
              vscode.window.showInformationMessage(message.text);
              info.push(...message.text_arr); // update info with retrieved text
              restartWebView(panel, () =>
                getWebviewContent(context.extensionUri, info)
              );
              return;

            case "retrieveText":
              vscode.window.showInformationMessage(
                `Retrieved text: ${message.textArray.join(", ")}`
              );
              info = message.textArray; // update info with retrieved text
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

export function deactivate() {}

function getWebviewContent(
  extensionUri: vscode.Uri,
  elements: string[]
): string {
  const scriptUri = vscode.Uri.joinPath(extensionUri, "media", "script.js");
  const styleUri = vscode.Uri.joinPath(extensionUri, "media", "style.css");
  const scriptSrc = scriptUri.with({ scheme: "vscode-resource" }).toString();
  const styleSrc = styleUri.with({ scheme: "vscode-resource" }).toString();
  let inputsHtml = "";
  elements.forEach((element, index) => {
    inputsHtml += `
      <div>
        <label for="element${index}">${element}</label>
        <input type="text" id="element${index}" name="element${index}">
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
        <button type="button" onclick="retrieveText()">Get Text</button>
      </form>
      <script>
        const vscode = acquireVsCodeApi();
        function retrieveText() {
          const textArray = [];
          const inputs = document.querySelectorAll('input[type="text"]');
          
          inputs.forEach(input => {
            textArray.push(input.value);
          });

          vscode.postMessage({
            command: 'new_info',
            text_arr: textArray
          });
        }
      </script>
    </body>
    </html>
  `;
}
