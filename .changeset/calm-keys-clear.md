---
"@clack/prompts": minor
"@clack/core": minor
---

Pressing Escape in `autocomplete` and `autocompleteMultiselect` now clears the search input when it has text, and only cancels the prompt once the input is empty. Selections are kept. Ctrl+C still cancels right away, and the `path` prompt keeps cancelling on Escape. Pass `clearOnCancel: false` to keep the previous behavior. Prompts built on `@clack/core` can override the new `_shouldCancel()` hook to skip a cancel.
