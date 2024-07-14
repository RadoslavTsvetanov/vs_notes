import { customSearch } from "./utils/smells_finders";

const stringToExecute = `     
function searchString(input) {\n      const positions = [];\n      let match;\n      const regex = /o/g;\n      while (match = regex.exec(input)) {\n        positions.push({ start: match.index, end: match.index + 1 });\n      }\n      return positions;\n    }\n

`;

console.log(customSearch("hi this is me o o o o o", stringToExecute));
