---
"@clack/prompts": minor
"@clack/core": minor
---

Adds a new `updateSettings()` export to support global Clack configuration.

In this release, `updateSettings()` accepts an `aliases` object which maps custom keys to an action (one of `up | down | left | right | space | enter | cancel`). In the future, settings will support more options.

```ts
import { updateSettings } from '@clack/prompts'

// Update Clack to recognize custom keybindings
// before calling any prompts
updateSettings({
    aliases: {
        w: 'up',
        a: 'left',
        s: 'down',
        d: 'right'
    }
})
```
