---
"@clack/prompts": minor
---

Updates the API for stopping spinners and progress bars to be clearer

Previously, both the spinner and progress bar components used a single `stop` method that accepted a code to indicate success, cancellation, or error. This update separates these into distinct methods: `stop()`, `cancel()`, and `error()`:

```diff
const spinner = prompts.spinner();
spinner.start();

// Cancelling a spinner
- spinner.stop(undefined, 1);
+ spinner.cancel();

// Stopping with an error
- spinner.stop(undefined, 2);
+ spinner.error();
```

As before, you can pass a message to each method to customize the output displayed:

```js
spinner.cancel("Operation cancelled by user");
progressBar.error("An error occurred during processing");
```
