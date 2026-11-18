---
"@clack/prompts": patch
---

`cancel()` called without a message now shows `settings.messages.cancel`, so a message set with `updateSettings({ messages: { cancel } })` is displayed.
