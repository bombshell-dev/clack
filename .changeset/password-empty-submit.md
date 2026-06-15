---
"@clack/core": patch
---

Fix `password` prompt resolving to `undefined` on empty submit. It now normalizes an empty submission to `""`, matching the `text` prompt behavior and the documented `Promise<string | symbol>` return type.
