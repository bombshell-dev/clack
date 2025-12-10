---
"@clack/prompts": minor
---

Add theme support for the text prompt. Users can now customize the colors of symbols, guide lines, and error messages by passing a `theme` option.

Example usage:
```typescript
import { text } from '@clack/prompts';
import color from 'picocolors';

const result = await text({
  message: 'Enter your name',
  theme: {
    formatSymbolActive: (str) => color.magenta(str),
    formatGuide: (str) => color.blue(str),
    formatErrorMessage: (str) => color.bgRed(color.white(str)),
  }
});
```

Available theme options for text prompt:
- `formatSymbolActive` - Format the prompt symbol in active/initial state
- `formatSymbolSubmit` - Format the prompt symbol on submit
- `formatSymbolCancel` - Format the prompt symbol on cancel
- `formatSymbolError` - Format the prompt symbol on error
- `formatErrorMessage` - Format error messages
- `formatGuide` - Format the left guide line in active state
- `formatGuideSubmit` - Format the guide line on submit
- `formatGuideCancel` - Format the guide line on cancel
- `formatGuideError` - Format the guide line on error

This establishes the foundation for theming support that will be extended to other prompts.

