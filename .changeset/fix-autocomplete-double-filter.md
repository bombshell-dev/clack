---
'@clack/core': patch
---

fix(core): skip double-filtering when options is a function

When `options` is provided as a function, the caller manages their own filtering. The default filter is no longer applied on top of the function's results, preventing valid matches from being silently dropped.
