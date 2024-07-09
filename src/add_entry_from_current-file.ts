import { addToConfig } from "./management_pane";
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

function CreateInput(
  onDidChange: (value: string) => void,
  prompt: string,
  onDidAccept: (value: string) => void
) {
  const inputBox = vscode.window.createInputBox();
  inputBox.prompt = prompt;
  inputBox.onDidAccept(() => {
    onDidAccept(inputBox.value);

    console.log("oooooo", inputBox.value);
    inputBox.dispose();
  });
  inputBox.onDidChangeValue((val: string) => {
    onDidChange(val);
  });

  inputBox.show();
}

export function SetUpInputBox(context: vscode.ExtensionContext) {
  let counter = 0;
  let disposable = vscode.commands.registerCommand("vs.inFileEntry", () => {
    console.log("lo");

    const inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue((value) => {
      // TODO fx bug where if you delete all input e,g, bacjspace a ton it stops working
      console.log("lppl" + counter);
      counter += 1;
      clearExtensionTDecorations();
      console.log("poop", value.length, typeof value.length);
      if (value.length === 0) {
        console.log("does this run 1");
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

      inputBox.dispose();
      let scope = null;
      // const ScopeInput = vscode.window.createInputBox();
      // ScopeInput.prompt =
      //   "enter for which file types you want this to apply: seperate by comma";

      // ScopeInput.onDidAccept(() => {
      //   console.log("file types ->" + ScopeInput.value);
      //   const fileTypes = ScopeInput.value.split(",").map((x) => x.trim());
      // });

      // ScopeInput.show();

      CreateInput(
        (val: string) => {
          console.log(val);
        },
        "enter for which file types you want this to apply: seperate by comma",
        (val: string) => {
          scope = val.split(",").map((x) => x.trim());
          CreateInput(
            (val: string) => {
              console.log(val);
              const fileTypes = val.split(",").map((x) => x.trim());
            },
            "enter a note",
            (val: string) => {
              console.log("note:", val);
            }
          );
        }
      );

      console.log("lool", scope);
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
