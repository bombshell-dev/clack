# `@clack/prompts`

Effortlessly build beautiful command-line apps 🪄 [Try the demo](https://stackblitz.com/edit/clack-prompts?file=index.js)

![clack-prompt](https://github.com/bombshell-dev/clack/blob/main/.github/assets/clack-demo.gif)

---

`@clack/prompts` is an opinionated, pre-styled wrapper around [`@clack/core`](https://www.npmjs.com/package/@clack/core).

- 🤏 80% smaller than other options
- 💎 Beautiful, minimal UI
- ✅ Simple API
- 🧱 Comes with `text`, `password`, `confirm`, `date`, `select`, `autocomplete`, `selectKey`, `multiselect`, `path`, and `spinner` components

## Basics

### Setup

The `intro` and `outro` functions will print a message to begin or end a prompt session, respectively.

```js
import { intro, outro } from '@clack/prompts';

intro(`create-my-app`);
// Do stuff
outro(`You're all set!`);
```

### Cancellation

The `isCancel` function is a guard that detects when a user cancels a question with `CTRL + C`. You should handle this situation for each prompt, optionally providing a nice cancellation message with the `cancel` utility.

```js
import { isCancel, cancel, text } from '@clack/prompts';

const value = await text({
  message: 'What is the meaning of life?',
});

if (isCancel(value)) {
  cancel('Operation cancelled.');
  process.exit(0);
}
```

## Components

### Text

The text component accepts a single line of text.

```js
import { text } from '@clack/prompts';

const meaning = await text({
  message: 'What is the meaning of life?',
  placeholder: 'Not sure',
  initialValue: '42',
  validate(value) {
    if (value.length === 0) return `Value is required!`;
  },
});
```

### Password

The password prompt behaves like the [`text`](#text) prompt, but masks the input as the user types.

```js
import { password } from '@clack/prompts';

const secret = await password({
  message: 'Set a password.',
  mask: '*',
  validate(value) {
    if (!value || value.length < 8) return 'Password must be at least 8 characters.';
  },
});
```

### Confirm

The `confirm` prompt accepts a yes or no choice, returning a boolean value corresponding to the user's selection.

```js
import { confirm } from '@clack/prompts';

const shouldContinue = await confirm({
  message: 'Do you want to continue?',
});
```

### Date

The date component accepts a calendar date and returns a `Date` value.

```js
import { date } from '@clack/prompts';

const dueDate = await date({
  message: 'Pick a due date.',
  format: 'YMD',
  minDate: new Date(Date.UTC(2026, 0, 1)),
  maxDate: new Date(Date.UTC(2026, 11, 31)),
});
```

### Select

The select component allows a user to choose one value from a list of options. The result is the `value` prop of a given option.

```js
import { select } from '@clack/prompts';

const projectType = await select({
  message: 'Pick a project type.',
  options: [
    { value: 'ts', label: 'TypeScript' },
    { value: 'js', label: 'JavaScript', disabled: true },
    { value: 'coffee', label: 'CoffeeScript', hint: 'oh no' },
  ],
});
```

### Autocomplete

The `autocomplete` prompt combines text input with a searchable list of options. It's perfect for when you have a large list of options and want to help users find what they're looking for quickly.

```js
import { autocomplete } from '@clack/prompts';

const framework = await autocomplete({
  message: 'Pick a framework.',
  placeholder: 'Type to search...',
  options: [
    { value: 'next', label: 'Next.js' },
    { value: 'nuxt', label: 'Nuxt' },
    { value: 'sveltekit', label: 'SvelteKit' },
    { value: 'remix', label: 'Remix' },
  ],
});
```

### Autocomplete Multi-Select

The `autocompleteMultiselect` prompt combines the search functionality of [autocomplete](#autocomplete) with the ability to select multiple options.

```js
import { autocomplete } from '@clack/prompts';

const framework = await autocomplete({
  message: 'Search for a framework',
  options: [
    { value: 'next', label: 'Next.js', hint: 'React framework' },
    { value: 'astro', label: 'Astro', hint: 'Content-focused' },
    { value: 'svelte', label: 'SvelteKit', hint: 'Compile-time framework' },
    { value: 'remix', label: 'Remix', hint: 'Full stack framework' },
    { value: 'nuxt', label: 'Nuxt', hint: 'Vue framework' },
  ],
  placeholder: 'Type to search...',
  maxItems: 5,
});
```

### Select Key

The `selectKey` component lets a user choose an option by pressing its single-character string `value` key directly.

```js
import { selectKey } from '@clack/prompts';

const action = await selectKey({
  message: 'Pick an action.',
  options: [
    { value: 'd', label: 'Deploy' },
    { value: 't', label: 'Run tests' },
    { value: 'q', label: 'Quit' },
  ],
});
```

### Multi-Select

The `multiselect` component allows a user to choose many values from a list of options. The result is an array with all selected `value` props.

```js
import { multiselect } from '@clack/prompts';

const additionalTools = await multiselect({
  message: 'Select additional tools.',
  options: [
    { value: 'eslint', label: 'ESLint', hint: 'recommended' },
    { value: 'prettier', label: 'Prettier', disabled: true },
    { value: 'gh-action', label: 'GitHub Action' },
  ],
  required: false,
});
```

It is also possible to select multiple items arranged into hierarchy by using `groupMultiselect`:

```js
import { groupMultiselect } from '@clack/prompts';

const basket = await groupMultiselect({
  message: 'Select your favorite fruits and vegetables:',
  options: {
    fruits: [
      { value: 'apple', label: 'apple' },
      { value: 'banana', label: 'banana' },
      { value: 'cherry', label: 'cherry' },
    ],
    vegetables: [
      { value: 'carrot', label: 'carrot' },
      { value: 'spinach', label: 'spinach' },
      { value: 'potato', label: 'potato' },
    ]
  }
});
```

### Multi-Line Text

The multi-line prompt accepts multiple lines of text input. By default, pressing `Enter` twice submits the input.

```js
import { multiline } from '@clack/prompts';

const bio = await multiline({
  message: 'Tell us about yourself.',
  placeholder: 'Start typing...',
  validate(value) {
    if (value.length === 0) return `value is required`;
  },
});
```

Set `showSubmit` to display an explicit submit button instead of double `Enter` submission:

```js
const bio = await multiline({
  message: 'Tell us about yourself.',
  showSubmit: true,
});
```

### Path

The `path` prompt extends [`autocomplete`](#autocomplete) to provide file and directory suggestions.

```js
import { path } from '@clack/prompts';

const targetDir = await path({
  message: 'Select an existing directory.',
  directory: true,
});
```

### Spinner

The spinner component surfaces a pending action, such as a long-running download or dependency installation.

```js
import { spinner } from '@clack/prompts';

const s = spinner();
s.start('Installing via npm');
// Do installation here
s.stop('Installed via npm');
```

### Progress

The progress component extends the spinner component to add a progress bar to visualize the progression of an action.

```js
import { progress } from '@clack/prompts';

const p = progress({ max: 10 });
p.start('Downloading archive');
// Do download here
p.advance(3, 'Downloading (30%)');
// ...
p.advance(5, 'Downloading (80%)');
// ...
p.stop('Archive downloaded');
```

## Utilities

### Grouping

Grouping prompts together is a great way to keep your code organized. This accepts a JSON object with a name that can be used to reference the group later. The second argument is an optional but has a `onCancel` callback that will be called if the user cancels one of the prompts in the group.

```js
import * as p from '@clack/prompts';

const group = await p.group(
  {
    name: () => p.text({ message: 'What is your name?' }),
    age: () => p.text({ message: 'What is your age?' }),
    color: ({ results }) =>
      p.multiselect({
        message: `What is your favorite color ${results.name}?`,
        options: [
          { value: 'red', label: 'Red' },
          { value: 'green', label: 'Green' },
          { value: 'blue', label: 'Blue' },
        ],
      }),
  },
  {
    // On Cancel callback that wraps the group
    // So if the user cancels one of the prompts in the group this function will be called
    onCancel: ({ results }) => {
      p.cancel('Operation cancelled.');
      process.exit(0);
    },
  }
);

console.log(group.name, group.age, group.color);
```

### Tasks

Execute multiple tasks in spinners.

```js
import { tasks } from '@clack/prompts';

await tasks([
  {
    title: 'Installing via npm',
    task: async (message) => {
      // Do installation here
      return 'Installed via npm';
    },
  },
]);
```

### Logs

```js
import { log } from '@clack/prompts';

log.info('Info!');
log.success('Success!');
log.step('Step!');
log.warn('Warn!');
log.error('Error!');
log.message('Hello, World', { symbol: color.cyan('~') });
```


### Stream

When interacting with dynamic LLMs or other streaming message providers, use the `stream` APIs to log messages from an iterable, even an async one.

```js
import { stream } from '@clack/prompts';

stream.info((function *() { yield 'Info!'; })());
stream.success((function *() { yield 'Success!'; })());
stream.step((function *() { yield 'Step!'; })());
stream.warn((function *() { yield 'Warn!'; })());
stream.error((function *() { yield 'Error!'; })());
stream.message((function *() { yield 'Hello'; yield ", World" })(), { symbol: color.cyan('~') });
```

![clack-log-prompts](https://github.com/bombshell-dev/clack/blob/main/.github/assets/clack-logs.png)

### Task Log

When executing a sub-process or a similar sub-task, `taskLog` can be used to render the output continuously and clear it at the end if it was successful.

```js
import { taskLog } from '@clack/prompts';

const log = taskLog({
	title: 'Running npm install'
});

for await (const line of npmInstall()) {
	log.message(line);
}

if (success) {
	log.success('Done!');
} else {
	log.error('Failed!');
}
```
