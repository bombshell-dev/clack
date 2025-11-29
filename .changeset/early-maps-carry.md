---
"@clack/prompts": patch
---

Fix duplicated logs when scrolling through options with multiline messages by calculating `rowPadding` dynamically based on actual rendered lines instead of using a hardcoded value.
