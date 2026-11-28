---
'@clack/core': minor
'@clack/prompts': minor
---

Add back navigation to `group`

The `group` utility can now return to a previous step. Pressing `Shift+Tab`
during a prompt returns to the previous one. Answers are kept, and each step
receives its previous answer as `previous`, so passing it to the prompt's
`initialValue` restores what the user had entered. It is on by default and can
be turned off with `group(prompts, { navigate: false })`; an
`onBack({ from, to, results })` callback is also available.

Under the hood this adds a `back` action to `@clack/core` (unbound by default, so
standalone prompts are unchanged), a `BACK_SYMBOL`/`isBack()` pair mirroring
`CANCEL_SYMBOL`/`isCancel()`, and a `'back'` prompt state. Closes #39.
