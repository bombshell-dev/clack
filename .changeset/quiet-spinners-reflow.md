---
"@clack/prompts": patch
---

Fix `spinner` (and `progress`) leaving stale lines behind when the terminal is resized, or when the spinner frame wraps, by measuring the last rendered frame at the current terminal width before clearing it.
