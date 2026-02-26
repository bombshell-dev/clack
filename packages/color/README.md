# `@clack/color`

Native [`styleText`](https://nodejs.org/api/util.html#utilstyletextformat-text-options) with a cool DX _à la_ chalk.

```ts
import c from "@clack/color";

// Function style
console.log(c.red.bgWhite("Hello, World!"));

// Template literal style
console.log(c.red.bgWhite`Hello, ${name}!`);
```

Create your own styles:

```ts
import { createStyleText } from "@clack/color";

export const warning = createStyleText("yellow", "underline");
```
