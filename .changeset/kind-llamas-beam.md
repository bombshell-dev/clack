---
"@clack/prompts": minor
"@clack/core": minor
---

Adds a new `updateSettings()` function to support new global keybindings.

`updateSettings()` accepts an `aliases` object that maps custom keys to an action (`up | down | left | right | space | enter | cancel`).

```ts
import { updateSettings } from "@clack/prompts";

// Support custom keybindings
updateSettings({
  aliases: {
    w: "up",
    a: "left",
    s: "down",
    d: "right",
  },
});
```

> [!WARNING]
> In order to enforce consistent, user-friendly defaults across the ecosystem, `updateSettings` does not support disabling Clack's default keybindings.
