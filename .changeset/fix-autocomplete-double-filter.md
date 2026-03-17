---
'@clack/core': minor
---

feat(core): skip default filter when options is a function

When `options` is provided as a function, the default filter is no longer applied on top of the function's results. If both `options` (function) and a custom `filter` are provided, the filter is still applied.
