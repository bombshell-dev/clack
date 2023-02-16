---
"@clack/core": patch
---

Fix `MaxListenersExceededWarning` by detaching `stdin` listeners on close
