---
"@clack/prompts": minor
"@clack/core": minor
---

Add tab-completion to the `path` prompt: pressing Tab fills the input with the focused suggestion, so you can quickly descend into deep directories (type `/` and Tab again). Powered by a new opt-in `completeOnTab` option on `autocomplete`, which also shows a `Tab: complete` hint in the instructions footer. Default `autocomplete` behavior is unchanged.
