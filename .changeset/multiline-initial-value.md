---
"@clack/core": patch
---

Fix `multiline` prompt ignoring `initialValue`. The editor is now seeded with `initialValue` (falling back to `initialUserInput`) when the prompt opens, matching the `text` prompt.
