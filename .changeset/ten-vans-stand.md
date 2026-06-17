---
"@clack/core": patch
---

fix: only submit multi-line prompt when double-return happens at end of input.

Also fixes two minor things:

- Initial value is used as initial user input for multi-line prompts
- Cursor is placed at the end when there is initial input
