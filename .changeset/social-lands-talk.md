---
"@clack/prompts": minor
"@clack/core": minor
---

Adds support for Standard Schema validation

Prompts accept an optional `validate()` function to validate user input. While a function provides more flexibility and customization over your validation, it can be a bit verbose. To help solve this, there are libraries that provide schema-based validation to make shorthand and type-strict validation substantially easier.

Libraries following the [Standard Schema specification](https://github.com/standard-schema/standard-schema) are now natively supported. For example, using [Arktype](https://arktype.io/):

```diff
import { text } from '@clack/prompts';
import { type } from 'arktype';

const name = await text({
	message: 'Enter your email',
+	validate: type('string.email').describe('Invalid email'),
});
```
