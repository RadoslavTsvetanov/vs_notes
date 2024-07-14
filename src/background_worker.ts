import * as vscode from "vscode";
import { getConfig } from "./utils/config_interacter";
import { JSON_CONFIG, Entry, PatternType } from "./utils/types";
import {
  searchUsingRegex,
  searchUsingAI,
  customSearch,
} from "./utils/smells_finders";

export type couldBeNumber = null | number;
class Decoration {
  private type: vscode.TextEditorDecorationType;
  private id: couldBeNumber;

  constructor(type: vscode.TextEditorDecorationType, id: couldBeNumber) {
    this.type = type;
    this.id = id;
  }

  getId() {
    return this.id;
  }

  getType() {
    return this.type;
  }
}

class Decorations {
  private decorations: Decoration[];
  private editor: vscode.TextEditor;

  constructor() {
    this.decorations = [];
    const currentEditor = vscode.window.activeTextEditor;
    if (!currentEditor) {
      console.log("No active text editor");
      throw new Error("No active text editor");
      return;
    }
    this.editor = currentEditor;
  }

  addDecoration(
    type: vscode.TextEditorDecorationType,
    range: vscode.Range,
    id: couldBeNumber = null
  ) {
    this.editor.setDecorations(type, [range]);
    this.decorations.push(new Decoration(type, id));
  }

  getAllDecorations() {
    return this.decorations;
  }

  clearDecorations() {
    this.decorations.forEach((decoration) => decoration.getType().dispose());
    this.decorations = [];
  }

  setEditor(editor: vscode.TextEditor) {
    this.editor = editor;
  }

  clearDecoration(id: couldBeNumber) {
    this.decorations = this.decorations.filter((decoration) => {
      if (decoration.getId() === id) {
        decoration.getType().dispose();
        return false;
      }
      return true;
    });
  }
}
export const decorations = new Decorations();

export function getFileExtension(path: string) {
  return path.substring(getIndexOfLastDot(path) + 1);
}

function getIndexOfLastDot(string: string) {
  return string.lastIndexOf(".");
}

export function highlightRange(
  start: number,
  end: number,
  id: couldBeNumber = null
) {
  const currentEditor = vscode.window.activeTextEditor;
  if (!currentEditor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "yellow",
  });

  const startPos = currentEditor.document.positionAt(start);
  const endPos = currentEditor.document.positionAt(end);
  const range = new vscode.Range(startPos, endPos);

  decorations.addDecoration(decorationType, range, id);
}

export function createPopupMessage(
  message: string,
  startIndex: number,
  endIndex: number,
  id: couldBeNumber = null
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

  decorations.addDecoration(decorationType, range, id);
}

function clearDecorations() {
  decorations.clearDecorations();
}

export function setupBackgroundWorker(context: vscode.ExtensionContext) {
  const saveEventListener = vscode.workspace.onDidSaveTextDocument(
    (document) => {
      clearDecorations();

      const config = getConfig(context);
      const fileExtension = getFileExtension(document.uri.fsPath);
      const activeFilters = config.info.filter((entry) =>
        entry.scope.includes(fileExtension)
      );

      vscode.window.showInformationMessage(
        `Found ${activeFilters.length} filters`
      );

      checkFile(document.getText(), activeFilters);
    }
  );

  const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor) {
        decorations.setEditor(editor);
      }
    }
  );

  context.subscriptions.push(saveEventListener);
  context.subscriptions.push(editorChangeListener);
}

function checkFile(fileContent: string, filters: Entry[]) {
  for (const entry of filters) {
    searchForEntry(fileContent, entry);
  }
}

export function searchForEntry(stringToBeSearched: string, entry: Entry) {
  // TODO: make it so that instead of implementing the logic for each type independently
  if (entry.pattern.type === PatternType.regex) {
    const matchCoordinates = searchUsingRegex(
      stringToBeSearched,
      entry.pattern.thingToLookFor
    );

    for (const match of matchCoordinates) {
      highlightRange(match.start, match.end);
      createPopupMessage(entry.note, match.start, match.end);
    }
  } else if (entry.pattern.type === PatternType.ai) {
    searchUsingAI(stringToBeSearched, entry.pattern.thingToLookFor);
  } else if (entry.pattern.type === PatternType.custom) {
    const matches = customSearch(
      stringToBeSearched,
      entry.pattern.thingToLookFor
    );

    for (const match of matches) {
      highlightRange(match.start, match.end);
      createPopupMessage(entry.note, match.start, match.end);
    }
  }
}
