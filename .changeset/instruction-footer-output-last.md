---
"@clack/prompts": patch
---

Restore the `formatInstructionFooter(instructions, hasGuide)` signature from 1.8. The `output` stream added in 1.9.0 is now an optional third argument instead of the first, so existing two-argument calls work again.
