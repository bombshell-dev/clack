# `@clack/jsx`

This package contains JSX support for clack, allowing you to define your
prompts declaratively.

Each `Prompt` can be rendered as if it were a component:

```tsx
import {Confirm} from '@clack/jsx';

const p = (<Confirm message="yes?"></Confirm>);

const name = await p;

if (isCancel(name)) {
  process.exit(0);
}
```
