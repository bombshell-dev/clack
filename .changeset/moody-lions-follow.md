---
"@clack/prompts": minor
---

Add accessible mode to `spinner`: when enabled via the `accessible` option, the global setting, or the `ACCESSIBLE` env var, the spinner emits static, append-only, screen-reader friendly output, a plain start line, a "still working" heartbeat every 30 seconds, and a plain final line. Instead of animated in-place repaints.
