---
'@clack/core': minor
---

Add an `accessible` option to the shared `PromptOptions` and a resolved `accessible` getter on the base `Prompt`, so any prompt can opt into accessible mode individually. Resolution order: per-prompt option > `updateSettings({ accessible })` > the `ACCESSIBLE` environment variable.
