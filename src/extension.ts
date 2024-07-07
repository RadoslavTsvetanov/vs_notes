import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { SetUpUI } from "./management_pane";
import { setupBackgroundWorker } from "./background_worker";

export function activate(context: vscode.ExtensionContext) {
  SetUpUI(context);

  setupBackgroundWorker(context);
}
