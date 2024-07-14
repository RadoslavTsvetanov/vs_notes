# README

# How it works

1. You define notes which trigger based on a matcher ( regex pattern or ai ( not implemented yet ) ) and highlit it your code

2. you have two different commands:
   - display: you can view your configuration and add new ones
   - inFile: you can add new one to your configuration where you see what the regex matches in your current file

#

## What is this

- code buddy, it operates in the background whenever writing in vs code
- it analyzes the code for `smells` and tell you if he finds any
- A `smell` is a thing you dont want in your code ( can be thought as anti pattern ), for example naming a varible with a name of a reserved word ( yikes )

## How does it work

- Note: implementation may vary
- you define smells using a regex, using ai ( you need to put a description) or custom logic (for custom you define a function being run on the globally provided content obj and it returns a matches arr ( more on that later)

## Using custom

You are provided a content object called `file_content` which is a string with all the content of the file. Obviously since the thing that matters is the return you can implement a logic that does not use it at all. Here is an example.

**NOTE**: the function must return an arr of type:

```ts
type Position = { start: number; end: number };
type Positions = Position[];

function customSearch(fileContent: string): Position[];
```

```js

function dont_write_after_work_time(content){ // a smell for all your non sleep worders who dont know that yout should not write code after 8 p.m.since they are sleepy
if(getTime() > 8 p.m) {
   return [{start: 0, end: len(fileContent)}] // this will mark the whole docum
   }

}
```

Here is a full example

```js
import { customSearch } from "./utils/smells_finders";

const stringToExecute = `     
function searchString(input) {
      const positions = [];
      let match;
      const regex = /o/g;
      while (match = regex.exec(input)) {
        positions.push({ start: match.index, end: match.index + 1 });
      }
      return positions;
    }

`;

console.log(customSearch("hi this is me o o o o o", stringToExecute));
```

## Where its useful

- Ensuring standards in a codebase (for example all the things that are syntactically correct but you would want your team members to use)
- Making sure not to override a global var

## Example

- here is an example smell

```llvm
{
    name: "wrong console log",
  description: "detects if console log wss used wrong" ,
     smell: {
            search_tye: hardcoded string (this could be a regex too),
           thing_to_search_for: "consolelog"
              },
    scope: ["js"] // only for js files
 }
```

```llvm
{
name: "using `for in` in the wrokg language"
description: "using for in synta in the wrong lang"
smell: {
search_type: regex
thing_to_sesrch_for: r'\bfor\b,
scope: ["ts","js"]
}

}
```
