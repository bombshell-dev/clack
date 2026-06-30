---
"@clack/prompts": patch
---

Fix `box()` so a title wider than the box is truncated by display width instead of UTF-16 code units. A wide-character (CJK) title that overflowed the title budget previously produced ragged borders, and could throw `RangeError: Invalid count value` once the remainder passed to `'─'.repeat(...)` went negative.
