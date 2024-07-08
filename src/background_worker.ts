import * as vscode from "vscode";
import { getConfig } from "./utils/config_interacter";
import { JSON_CONFIG } from "./utils/types";
import { PattrenType, Pattern, Entry } from "./utils/types";

class Decorations {
  private decorations: vscode.TextEditorDecorationType[];
  private editor: vscode.TextEditor;
  constructor() {
    this.decorations = [];

    const currentEditor = vscode.window.activeTextEditor;
    if (currentEditor === undefined) {
      throw new Error("No active text editor");
    }

    this.editor = currentEditor;
  }

  addDecoration(type: vscode.TextEditorDecorationType, range: vscode.Range) {
    this.editor.setDecorations(type, [range]);
    this.decorations.push(type);
  }

  getAllDecorations() {
    return this.decorations;
  }

  clearDecorations() {
    this.decorations.forEach((decoration) => decoration.dispose());
    this.decorations = [];
  }
}

const decorations = new Decorations();

function getIndexOfLastDot(string: string) {
  return string.lastIndexOf(".");
}

function highlightRange(start: number, end: number) {
  const document = vscode.window.activeTextEditor?.document;
  if (!document) {
    return;
  }
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "yellow",
  });

  // Define the range to be highlighted
  const startPos = document.positionAt(start);
  const endPos = document.positionAt(end);

  const range = new vscode.Range(startPos, endPos);

  // Apply the decoration to the current active editor
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    decorations.addDecoration(decorationType, range);
  }
}
function createPopupMessage(
  message: string,
  startIndex: number,
  endIndex: number
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const startPosition = editor.document.positionAt(startIndex);
  const endPosition = editor.document.positionAt(endIndex);
  const range = new vscode.Range(startPosition, endPosition);
  const decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      contentText: message,
      margin: "10px",
    },
  });
  editor.setDecorations(decorationType, [range]);

  decorations.addDecoration(decorationType, range);
}
export function setupBackgroundWorker(context: vscode.ExtensionContext) {
  const saveEventListener = vscode.workspace.onDidSaveTextDocument(
    (document) => {
      const config = getConfig(context);

      const fileExtension = document.uri.fsPath.substring(
        getIndexOfLastDot(document.uri.fsPath) + 1
      );

      const active_filters = config.info.filter((entry) => {
        return entry.scope.includes(fileExtension);
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
    scanForString(fileContent, entry);
  }
}
function searchUsingRegex(stringToBeSearched: string, regexString: string) {
  const regex = new RegExp(regexString, "g");
  let matches;
  const matchPositions: { start: number; end: number }[] = [];

  // Find all matches and their positions
  while ((matches = regex.exec(stringToBeSearched)) !== null) {
    matchPositions.push({ start: matches.index, end: regex.lastIndex });
  }

  console.log(matchPositions);

  if (matchPositions.length > 0) {
    vscode.window.showInformationMessage(
      `Found '${regexString}' in '${stringToBeSearched}'`
    );
  } else {
    vscode.window.showInformationMessage(
      `No matches found for '${regexString}' in '${stringToBeSearched}'`
    );
  }

  return matchPositions;
}
function searchUsingAI(stringToBeSearched: string, thingToLookFor: string) {
  vscode.window.showInformationMessage("not implemented yet :)");
}

function scanForString(stringToBeSearched: string, entry: Entry) {
  if (entry.pattern.type === PattrenType.regex) {
    const coordinatesOfMAtched = searchUsingRegex(
      stringToBeSearched,
      entry.pattern.thingToLookFor
    );
    for (const match of coordinatesOfMAtched) {
      console.log(`Found '${entry.pattern.thingToLookFor}' at ${match.start}`);
      highlightRange(match.start, match.end);
      createPopupMessage(entry.note, match.start, match.end);
    }
  } else if (entry.pattern.type === PattrenType.ai) {
    searchUsingAI(stringToBeSearched, entry.pattern.thingToLookFor);
  }
}
