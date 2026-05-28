---
"@clack/prompts": patch
---

Add `onCancel` callback option to all prompts

All prompt functions now accept an optional `onCancel` callback that is
invoked when the user cancels (Ctrl+C or Escape). When the callback's
return type is `never` (e.g. it calls `process.exit` or throws), the
prompt's return type narrows to exclude the cancel symbol:

```ts
const result = await confirm({
  message: 'Continue?',
  onCancel: () => {
    cancel('Operation cancelled.');
    process.exit(0);
  },
});
// result is `boolean` — no `isCancel` guard needed
```

For callbacks that return `void`, the return type remains `T | symbol` as
before. Also exports `handleCancel` utility for custom prompt implementations.
