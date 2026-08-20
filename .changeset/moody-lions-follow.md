---
"@clack/prompts": minor
---

Add accessible mode to `spinner`: when enabled via the `accessible` option, the global setting, or the `ACCESSIBLE` env var, the spinner emits static, append-only, screen-reader friendly output, a plain start line, a periodic "still working" heartbeat configurable via `accessibleInterval`, and a plain final line. Instead of animated in-place repaints.
