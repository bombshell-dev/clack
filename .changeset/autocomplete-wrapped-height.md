---
'@clack/prompts': patch
---

Count wrapped message, search, and instruction lines when sizing `autocomplete` and `autocompleteMultiselect` option lists, so the prompts stay within the terminal height in narrow terminals instead of leaving stale rows on redraw.
