---
'@clack/prompts': patch
'@clack/core': patch
---

Fix line duplication by properly wrapping prompt's lines to `process.stdout.columns`
