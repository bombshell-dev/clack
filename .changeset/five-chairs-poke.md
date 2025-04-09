---
"@clack/prompts": minor
---

Add support for customizable spinner cancel and error messages. Users can now customize these messages either per spinner instance or globally via the `updateSettings` function to support multilingual CLIs.

```ts
// Per-instance customization
const spinner = prompts.spinner({
  cancelMessage: 'Operación cancelada',  // "Operation cancelled" in Spanish
  errorMessage: 'Se produjo un error'    // "An error occurred" in Spanish
});

// Global customization via settings
prompts.updateSettings({
  messages: {
    cancel: 'Operación cancelada',       // "Operation cancelled" in Spanish
    error: 'Se produjo un error'         // "An error occurred" in Spanish
  }
});

// Direct options take priority over global settings
const spinner = prompts.spinner({
  cancelMessage: 'Cancelled',  // This will be used instead of the global setting
});
```
