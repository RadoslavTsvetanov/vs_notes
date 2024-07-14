import { addEntriesToConfig, addToConfig } from "./management_pane";
import * as vscode from "vscode";
import {
  createPopupMessage,
  getFileExtension,
  highlightRange,
  searchForEntry,
} from "./background_worker";
import { PatternType, Entry } from "./utils/types";
import type { couldBeNumber } from "./background_worker";
import { decorations } from "./background_worker";

import { searchUsingRegex } from "./utils/smells_finders";
let TextDocId: couldBeNumber = null;
let ColoringId: couldBeNumber = null;

function clearExtensionTextDecorations(textDecorationsId: couldBeNumber) {
  if (textDecorationsId === null) {
    return;
  }

  decorations.clearDecoration(textDecorationsId);
  TextDocId = null;
}

function clearHighlightDecorations(textDecorationsId: couldBeNumber) {
  if (textDecorationsId === null) {
    return;
  }

  decorations.clearDecoration(textDecorationsId);
  ColoringId = null;
}

function clearExtensionDecorations() {
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
    const newEntry: Entry = {
      note: "",
      scope: [],
      pattern: { type: PatternType.regex, thingToLookFor: "" },
    };
    CreateInput(
      (value: string) => {
        clearExtensionDecorations();
        if (value.length === 0) {
          // np input string crashes the regex eval
          return;
        }
        logCurrentInput(value);
      },
      "Enter regex here",
      (value: string) => {
        const input = value;
        vscode.window.showInformationMessage(`You entered: ${input}`);
        clearExtensionDecorations();
        newEntry.pattern.thingToLookFor = input;
        newEntry.pattern.type = PatternType.regex;

        CreateInput(
          (val: string) => {},
          "Enter file types (comma-separated)",
          (val: string) => {
            let scope = val.split(",").map((x) => x.trim());
            newEntry.scope = scope;
            CreateInput(
              (val: string) => {},
              "Enter a note",
              (val: string) => {
                newEntry.note = val;
                addEntriesToConfig(context, [newEntry]); // Assuming this function adds the new entry to the config
                vscode.window.showInformationMessage(
                  "New entry added to config"
                );
              }
            );
          }
        );
      }
    );
  });

  context.subscriptions.push(disposable);
}

async function logCurrentInput(input: string) {
  const currentFileContent = vscode.window.activeTextEditor?.document.getText();
  if (currentFileContent === undefined) {
    console.log("No file content");
    return;
  }
  if (input.trim() === "") {
    return;
  }

  const foundPositions = await searchUsingRegex(currentFileContent, input);

  for (const posixPosition of foundPositions) {
    const id = 7;
    highlightRange(posixPosition.start, posixPosition.end, id);
    ColoringId = id;

    const newId = 10;
    createPopupMessage(
      "This was found from your input field",
      posixPosition.start,
      posixPosition.end,
      newId
    );
    TextDocId = newId;
  }
}
