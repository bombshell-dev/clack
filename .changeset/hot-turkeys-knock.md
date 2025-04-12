---
"@clack/core": patch
---

Fixes an edge case for placeholder values. Previously, when pressing `enter` on an empty prompt, placeholder values would be ignored. Now, placeholder values are treated as the prompt value.
