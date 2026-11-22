---
"@clack/prompts": patch
---

Fix spinner and progress bar flickering by overwriting lines in place (`CSI K`) in a single `output.write()` wrapped in DEC Mode 2026 synchronized output instead of erasing before redrawing across multiple writes.
