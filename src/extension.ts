import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { SetUpUI } from "./management_pane";
export function activate(context: vscode.ExtensionContext) {
  SetUpUI(context);
}
