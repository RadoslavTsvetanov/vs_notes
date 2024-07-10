import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { Pattern, JSON_CONFIG, Entry } from "./types";

export function getConfigPath(context: vscode.ExtensionContext) {
  return path.join(context.extensionUri.fsPath, "config.json");
}

export function writeToJSONFile( // writes the config to the folder where the extension source code is saved
  context: vscode.ExtensionContext,
  object: object,
  filename: string
) {
  fs.writeFileSync(
    path.join(context.extensionUri.fsPath, filename),
    JSON.stringify(object)
  );
}

export function readJsonFileAndExtractObject(
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

export function getConfig(context: vscode.ExtensionContext): JSON_CONFIG {
  return readJsonFileAndExtractObject(context, "config.json");
}
