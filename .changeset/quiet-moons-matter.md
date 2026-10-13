---
"@clack/prompts": minor
"@clack/core": patch
---

Allow `multiselect` to accept readonly option arrays, e.g. options declared with `as const`. The `Value` type parameter is now inferred as a literal union (`'a' | 'b'`) from such arrays, and `initialValues` also accepts readonly arrays.
