---
'@clack/core': minor
---

Add `isAccessible()` and an `accessible` setting as the foundation for accessible mode. Resolution order: per-call option > `updateSettings({ accessible })` > the `ACCESSIBLE` environment variable (any non-empty value enables it, except `0` and `false`).
