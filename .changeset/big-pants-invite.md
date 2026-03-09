---
"@clack/prompts": patch
---

Fix the `path` prompt so `directory: true` correctly enforces directory-only selection while still allowing directory navigation, and add regression tests for both directory and default file selection behavior.
