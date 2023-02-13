# `@clack/prompts`

Effortlessly build beautiful command-line apps 🪄

https://user-images.githubusercontent.com/7118177/218354495-aece6e96-cad2-403b-85d1-921a689556e4.mp4

---

`@clack/prompts` is an opinionated, pre-styled wrapper around [`@clack/core`](https://www.npmjs.com/package/@clack/core).

- 🤏 Only 4 kB gzip (80% smaller than `prompts`)
- 💎 Beautiful, minimal UI
- ✅ Simple API
- 🧱 Comes with `text`, `confirm`, `select`, and `spinner` components

## Basics

### Setup

The `intro` and `outro` functions will print a message to begin or end a prompt session, respectively.

```js
import { intro, outro } from "@clack/prompts";

intro(`create-my-app`);
// Do stuff
outro(`You're all set!`);
```

### Cancellation

The `isCancel` function is a guard that detects when a user cancels a question with `CTRL + C`. You should handle this situation for each prompt, optionally providing a nice cancellation message with the `cancel` utility.

```js
import { isCancel, cancel, text } from "@clack/prompts";

const value = await text(/* TODO */);

if (isCancel(value)) {
  cancel("Operation cancelled.");
  process.exit(0);
}
```

## Components

### Text

The text component accepts a single line of text.

```js
import { text } from "@clack/prompts";

const meaning = await text({
  message: "What is the meaning of life?",
  placeholder: "Not sure",
  validate(value) {
    if (value.length === 0) return `Value is required!`;
  },
});
```

### Confirm

The confirm component accepts a yes or no answer. The result is a boolean value of `true` or `false`.

```js
import { confirm } from "@clack/prompts";

const shouldContinue = await confirm({
  message: "Do you want to continue?",
});
```

### Select

The select component allows a user to choose one value from a list of options. The result is the `value` prop of a given option.

```js
import { select } from "@clack/prompts";

const projectType = await select({
  message: "Pick a project type.",
  options: [
    { value: "ts", label: "TypeScript" },
    { value: "js", label: "JavaScript" },
    { value: "coffee", label: "CoffeeScript", hint: "oh no" },
  ],
});
```

### Spinner

The spinner component surfaces a pending action, such as a long-running download or dependency installation.

```js
import { spinner } from "@clack/prompts";

const s = spinner();
s.start("Installing via npm");
// Do installation
s.stop("Installed via npm");
```
