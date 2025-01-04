---
"@clack/prompts": patch
---

Replace custom utility for stripping ANSI control sequences with Node's built-in [`stripVTControlCharacters`](https://nodejs.org/docs/latest/api/util.html#utilstripvtcontrolcharactersstr) utility.
