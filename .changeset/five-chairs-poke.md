---
"@clack/prompts": minor
"@clack/core": minor
---

Add support for customizable spinner cancel and error messages. Users can now customize these messages either per spinner instance or globally via the `updateSettings` function to support multilingual CLIs.

This update also improves the architecture by exposing the core settings to the prompts package, enabling more consistent default message handling across the codebase.

```ts
// Per-instance customization
const spinner = prompts.spinner({
  cancelMessage: 'Operación cancelada',  // "Operation cancelled" in Spanish
  errorMessage: 'Se produjo un error'    // "An error occurred" in Spanish
});

// Global customization via updateSettings
prompts.updateSettings({
  messages: {
    cancel: 'Operación cancelada',       // "Operation cancelled" in Spanish
    error: 'Se produjo un error'         // "An error occurred" in Spanish
  }
});

// Settings can now be accessed directly
console.log(prompts.settings.messages.cancel); // "Operación cancelada"

// Direct options take priority over global settings
const spinner = prompts.spinner({
  cancelMessage: 'Cancelled',  // This will be used instead of the global setting
});
```
