---
"@clack/prompts": patch
---

Fix the `path` prompt in `directory` mode on Windows: typing a trailing `\` after a directory now lists its children instead of showing no matches.
