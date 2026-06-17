---
"@clack/prompts": minor
---

Updates default formatter of `note()` to note dim lines anymore

If you want the old behavior, provide a `format()` function:

```diff
import { note } from '@clack/prompts';
+import { styleText } from 'node:util';

note(
  'You can edit the file src/index.jsx',
  'Next steps.'
+  { format: (text) => styleText('dim', text) }
);
```
