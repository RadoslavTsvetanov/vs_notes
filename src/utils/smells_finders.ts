import childP from "child_process";
type Position = { start: number; end: number };
type Positions = Position[];

export function searchUsingRegex(
  stringToBeSearched: string,
  regexString: string
) {
  const matchPositions: Positions = [];
  try {
    const regex = new RegExp(regexString, "g");
    let matches;

    while ((matches = regex.exec(stringToBeSearched)) !== null) {
      matchPositions.push({ start: matches.index, end: regex.lastIndex });
    }
  } catch (e) {
    console.log("err", e);
  }

  return matchPositions;
}

export function searchUsingAI(
  stringToBeSearched: string,
  thingToLookFor: string
) {}
export function customSearch(
  stringToBeSearched: string,
  customFunctionToExecute: string
): Positions {
  try {
    const customFunction = eval(`(${customFunctionToExecute})`);

    if (typeof customFunction !== "function") {
      throw new Error("The provided custom function is not valid.");
    }

    const result: Positions = customFunction(stringToBeSearched);

    if (!Array.isArray(result)) {
      throw new Error("The custom function did not return an array.");
    }

    return result;
  } catch (error) {
    console.error("Error executing custom function:", error);
    return [];
  }
}

// import { spawn } from "child_process"; TODO make it so that it works with all kinds of custom scripts by allowing the user to make a note in which the filter is the way to run the file

// function runPythonScript(scriptPath: string): void {
//   const pythonProcess = spawn("python3", [scriptPath]);

//   pythonProcess.stdout.on("data", (data: Buffer) => {
//     console.log(`stdout: ${data.toString()}`);
//   });

//   pythonProcess.stderr.on("data", (data: Buffer) => {
//     console.error(`stderr: ${data.toString()}`);
//   });

//   pythonProcess.on("close", (code: number) => {
//     console.log(`child process exited with code ${code}`);
//   });
// }

// // Call the function with the path to your Python script
// runPythonScript("src/utils/main.py");
