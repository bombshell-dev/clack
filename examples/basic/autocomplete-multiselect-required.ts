import * as p from '@clack/prompts';
import color from 'picocolors';

/**
 * Example demonstrating the autocomplete multiselect with required validation
 * This reproduces the behavior from the skipped test:
 * "renders error when empty selection & required is true"
 */

async function main() {
	console.clear();

	p.intro(`${color.bgCyan(color.black(' Autocomplete Multiselect - Required Validation '))}`);

	p.note(
		`
${color.cyan('This example demonstrates required validation:')}
- ${color.yellow('Type')} to filter the list
- Use ${color.yellow('up/down arrows')} to navigate
- Press ${color.yellow('Space')} or ${color.yellow('Tab')} to select items
- Press ${color.yellow('Enter')} to submit ${color.red('(must select at least one item)')}
- Try submitting without selecting - you should see an error!
  `,
		'Instructions'
	);

	const testOptions = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
		{ value: 'grape', label: 'Grape' },
		{ value: 'orange', label: 'Orange' },
	];

	// Use autocompleteMultiselect with required: true
	const result = await p.autocompleteMultiselect<string>({
		message: 'Select a fruit',
		options: testOptions,
		required: true, // This should trigger validation if nothing is selected
	});

	if (p.isCancel(result)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	// Type guard
	function isStringArray(value: unknown): value is string[] {
		return Array.isArray(value) && value.every((item) => typeof item === 'string');
	}

	if (!isStringArray(result)) {
		throw new Error('Unexpected result type');
	}

	const selectedFruits = result;

	// Display result
	if (selectedFruits.length === 0) {
		p.note(
			color.yellow('No fruits were selected (this should not happen with required: true)'),
			'Warning'
		);
	} else {
		p.note(`You selected: ${color.green(selectedFruits.join(', '))}`, 'Selection Complete');
	}

	p.outro('Done!');
}

main().catch(console.error);
