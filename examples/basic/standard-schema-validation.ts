import { setTimeout } from 'node:timers/promises';
import { isCancel, note, text } from '@clack/prompts';
import { type } from 'arktype';

console.clear();

// Example demonstrating the issue with initial value validation
const name = await text({
	message: 'Enter your email',
	initialValue: 'aaa', // Invalid initial value without @
	validate: type('string.email').describe('Invalid email'),
});

if (!isCancel(name)) {
	note(`Valid name: ${name}`, 'Success');
}

await setTimeout(1000);

// Example with a valid initial value for comparison
const validName = await text({
	message: 'Enter another email',
	initialValue: 'john.doe@example.com', // Valid initial value
	validate: type('string.email').describe('Invalid email'),
});

if (!isCancel(validName)) {
	note(`Valid name: ${validName}`, 'Success');
}

await setTimeout(1000);
