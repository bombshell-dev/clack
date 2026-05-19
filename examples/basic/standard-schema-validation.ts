import { setTimeout } from 'node:timers/promises';
import { isCancel, note, text } from '@clack/prompts';
import { type } from 'arktype';

async function main() {
	console.clear();

	// Example demonstrating the issue with initial value validation
	const name = await text({
		message: 'Enter your name (letters only)',
		initialValue: 'John123', // Invalid initial value with numbers
		validate: type('string.alpha').describe('Name can only contain letters'),
	});

	if (!isCancel(name)) {
		note(`Valid name: ${name}`, 'Success');
	}

	await setTimeout(1000);

	// Example with a valid initial value for comparison
	const validName = await text({
		message: 'Enter another name (letters only)',
		initialValue: 'JohnDoe', // Valid initial value
		validate: type('string.alpha').describe('Name can only contain letters'),
	});

	if (!isCancel(validName)) {
		note(`Valid name: ${validName}`, 'Success');
	}

	await setTimeout(1000);
}

main().catch(console.error);
