---
'@clack/core': patch
'@clack/prompts': patch
---

Fix line duplication bug by automatically wrapping prompts to `process.stdout.columns`
