import * as vscode from "vscode";
import {
  createPopupMessage,
  getFileExtension,
  highlightRange,
  searchForEntry,
  searchUsingRegex,
} from "./background_worker";
import { PatternType } from "./utils/types";
import type { couldBeNumber } from "./background_worker";
let TextDocId: couldBeNumber = null;
let ColoringId: couldBeNumber = null;
import { decorations } from "./background_worker";

function clearExtensionTextDecorations(textDecorationsId: couldBeNumber) {
  if (textDecorationsId === null) {
    return;
  }

  decorations.clearDecoration(TextDocId);
  TextDocId = null;
}

function clearHighlightDecorations(textDecorationsId: couldBeNumber) {
  if (textDecorationsId === null) {
    return;
  }

  decorations.clearDecoration(ColoringId);
  ColoringId = null;
}

function clearExtensionTDecorations() {
  clearExtensionTextDecorations(TextDocId);
  clearHighlightDecorations(ColoringId);
}

export function SetUpInputBox(context: vscode.ExtensionContext) {
  let counter = 0;
  let disposable = vscode.commands.registerCommand("vs.inFileEntry", () => {
    console.log("lo");

    const inputBox = vscode.window.createInputBox();
    inputBox.value = ">";
    inputBox.onDidChangeValue((value) => {
      // TODO fx bug where if you delete all input e,g, bacjspace a ton it stops working
      console.log("lppl" + counter);
      counter += 1;
      clearExtensionTDecorations();
      console.log("poop", value.length, typeof value.length);
      if (value.length === 0) {
        console.log("does this run 1");
        inputBox.value = ">";
      }
      console.log("does this run 2");

      logCurrentInput(value);

      console.log("does this run 1");
    });

    inputBox.prompt = " enter regex here";
    inputBox.onDidAccept(() => {
      const input = inputBox.value;
      vscode.window.showInformationMessage(`You entered: ${input}`);

      clearExtensionTDecorations();
    });

    inputBox.onDidHide(() => {
      console.log("hiding");
      clearExtensionTDecorations();
    });

    inputBox.show();
  });

  context.subscriptions.push(disposable);
}

function logCurrentInput(input: string) {
  console.log("kokokokoko -> " + "(" + input + ")");
  const currentFileContent = vscode.window.activeTextEditor?.document.getText();
  const currentDocument = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (currentFileContent === undefined || currentDocument === undefined) {
    console.log("No file content");
    return;
  }
  if (input.trim() === "") {
    // ! dont touch this ever -> it makes sure there is always valid string passed to search using regex since there is some kind of strange va;ue which throws an error
    return;
  }
  const foundPositions = searchUsingRegex(currentFileContent, input);
  for (const posixPosition of foundPositions) {
    const id = 7;
    highlightRange(posixPosition.start, posixPosition.end, id);
    ColoringId = id;

    const newId = 10;
    createPopupMessage(
      "this was found from your input field",
      posixPosition.start,
      posixPosition.end,
      newId
    );
    TextDocId = newId;
  }
}
