import * as vscode from "vscode";
import { getConfig } from "./utils/config_interacter";
import { JSON_CONFIG } from "./utils/types";
import { PattrenType, Pattern, Entry } from "./utils/types";

export function setupBackgroundWorker(context: vscode.ExtensionContext) {
  const config = getConfig(context);

  const saveEventListener = vscode.workspace.onDidSaveTextDocument(
    (document) => {
      const active_filters = config.info.filter((entry) => {
        return !entry.scope.includes(document.languageId);
      });
      vscode.window.showInformationMessage(
        JSON.stringify(active_filters.length)
      );
      checkFile(document.getText(), active_filters);
    }
  );

  context.subscriptions.push(saveEventListener);
}

function checkFile(fileContent: string, filters: Entry[]) {
  for (const entry of filters) {
    scanForString(fileContent, entry.pattern);
  }
}
function searchUsingRegex(stringToBeSearched: string, regexString: string) {
  const regex = new RegExp(regexString);
  const matches = stringToBeSearched.match(regex);
  if (matches) {
    vscode.window.showInformationMessage(
      `Found '${regexString}' in '${stringToBeSearched}'`
    );
  }

  return;
}

function searchUsingAI(stringToBeSearched: string, thingToSearchFor: string) {
  vscode.window.showInformationMessage("not implemented yet :)");
}

function scanForString(stringToBeSearched: string, thingToSearchFor: Pattern) {
  if (thingToSearchFor.type === PattrenType.regex) {
    searchUsingRegex(stringToBeSearched, thingToSearchFor.thingToLookFor);
  } else if (thingToSearchFor.type === PattrenType.ai) {
    searchUsingAI(stringToBeSearched, thingToSearchFor.thingToLookFor);
  }
}
