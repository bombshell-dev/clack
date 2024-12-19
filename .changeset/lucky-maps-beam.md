---
"@clack/core": minor
"@clack/prompts": minor
---

Adds a new `signal` option to support programmatic prompt cancellation with an [abort controller](https://kettanaito.com/blog/dont-sleep-on-abort-controller).

One example use case is automatically cancelling a prompt after a timeout.

```ts
const shouldContinue = await confirm({
  message: 'This message will self destruct in 5 seconds',
  signal: AbortSignal.timeout(3000),
});
```

Another use case is a long running task which can be cancelled if the user submits a response to the prompt.

```ts
const abortController = new AbortController()

const projectType = await Promise.race([
  detectSystemSettings({
    signal: abortController.signal
  }),
  select({
    message: 'Pick a project type.',
    options: [
      { value: 'ts', label: 'TypeScript' },
      { value: 'js', label: 'JavaScript' },
      { value: 'coffee', label: 'CoffeeScript', hint: 'oh no'},
    ],
     signal: abortController.signal,
  });
])
```
