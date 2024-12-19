---
"@clack/prompts": minor
"@clack/core": minor
---

Adds a new `updateSettings()` function to support global customization.

`updateSettings()` accepts an `aliases` object that maps
custom keys to an action (one of
`up | down | left | right | space | enter | cancel`). In the future, `updateSettings()`
will support more even more customization options.

```ts
import { updateSettings } from "@clack/prompts";

// Update Clack to recognize custom keys keybindings
// before calling any prompts
updateSettings({
  aliases: {
    w: "up",
    a: "left",
    s: "down",
    d: "right",
  },
});
```
