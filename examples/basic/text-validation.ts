import { setTimeout } from 'node:timers/promises';
import { isCancel, note, text } from '@clack/prompts';

async function main() {
	console.clear();

	// Example demonstrating the issue with initial value validation
	const name = await text({
		message: 'Enter your name (letters and spaces only)',
		initialValue: 'John123', // Invalid initial value with numbers
		validate: (value) => {
			if (!value || !/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
			return undefined;
		},
	});

	if (!isCancel(name)) {
		note(`Valid name: ${name}`, 'Success');
	}

	await setTimeout(1000);

	// Example with a valid initial value for comparison
	const validName = await text({
		message: 'Enter another name (letters and spaces only)',
		initialValue: 'John Doe', // Valid initial value
		validate: (value) => {
			if (!value || !/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
			return undefined;
		},
	});

	if (!isCancel(validName)) {
		note(`Valid name: ${validName}`, 'Success');
	}

	await setTimeout(1000);
}

main().catch(console.error);
