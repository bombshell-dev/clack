---
'@clack/prompts': minor
---

Adds a new `indicator` option to `spinner`, which supports the original `"dots"` loading animation or a new `"timer"` loading animation.

```ts
import * as p from '@clack/prompts';

const spin = p.spinner({ indicator: 'timer' });
spin.start('Loading');
await sleep(3000);
spin.stop('Loaded');
