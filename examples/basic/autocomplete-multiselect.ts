import * as p from '@clack/prompts';
import color from 'picocolors';

/**
 * Example demonstrating the integrated autocomplete multiselect component
 * Which combines filtering and selection in a single interface
 */

async function main() {
	console.clear();

	p.intro(`${color.bgCyan(color.black(' Integrated Autocomplete Multiselect Example '))}`);

	p.note(
		`
${color.cyan('Filter and select multiple items in a single interface:')}
- ${color.yellow('Type')} to filter the list in real-time
- Use ${color.yellow('up/down arrows')} to navigate with improved stability
- Press ${color.yellow('Space')} to select/deselect the highlighted item ${color.green('(multiple selections allowed)')}
- Use ${color.yellow('Backspace')} to modify your filter text when searching for different options
- Press ${color.yellow('Enter')} when done selecting all items
- Press ${color.yellow('Ctrl+C')} to cancel
  `,
		'Instructions'
	);

	// Frameworks in alphabetical order
	const frameworks = [
		{ value: 'angular', label: 'Angular', hint: 'Frontend/UI' },
		{ value: 'django', label: 'Django', hint: 'Python Backend' },
		{ value: 'dotnet', label: '.NET Core', hint: 'C# Backend' },
		{ value: 'electron', label: 'Electron', hint: 'Desktop' },
		{ value: 'express', label: 'Express', hint: 'Node.js Backend' },
		{ value: 'flask', label: 'Flask', hint: 'Python Backend' },
		{ value: 'flutter', label: 'Flutter', hint: 'Mobile' },
		{ value: 'laravel', label: 'Laravel', hint: 'PHP Backend' },
		{ value: 'nestjs', label: 'NestJS', hint: 'Node.js Backend' },
		{ value: 'nextjs', label: 'Next.js', hint: 'React Framework' },
		{ value: 'nuxt', label: 'Nuxt.js', hint: 'Vue Framework' },
		{ value: 'rails', label: 'Ruby on Rails', hint: 'Ruby Backend' },
		{ value: 'react', label: 'React', hint: 'Frontend/UI' },
		{ value: 'reactnative', label: 'React Native', hint: 'Mobile' },
		{ value: 'spring', label: 'Spring Boot', hint: 'Java Backend' },
		{ value: 'svelte', label: 'Svelte', hint: 'Frontend/UI' },
		{ value: 'tauri', label: 'Tauri', hint: 'Desktop' },
		{ value: 'vue', label: 'Vue.js', hint: 'Frontend/UI' },
	];

	// Use the new integrated autocompleteMultiselect component
	const result = await p.autocompleteMultiselect<string>({
		message: 'Select frameworks (type to filter)',
		options: frameworks,
		placeholder: 'Type to filter...',
		maxItems: 8,
	});

	if (p.isCancel(result)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	// Type guard: if not a cancel symbol, result must be a string array
	function isStringArray(value: unknown): value is string[] {
		return Array.isArray(value) && value.every((item) => typeof item === 'string');
	}

	// We can now use the type guard to ensure type safety
	if (!isStringArray(result)) {
		throw new Error('Unexpected result type');
	}

	const selectedFrameworks = result;

	// If no items selected, show a message
	if (selectedFrameworks.length === 0) {
		p.note('No frameworks were selected', 'Empty Selection');
		process.exit(0);
	}

	// Display selected frameworks with detailed information
	p.note(
		`You selected ${color.green(selectedFrameworks.length)} frameworks:`,
		'Selection Complete'
	);

	// Show each selected framework with its details
	const selectedDetails = selectedFrameworks
		.map((value) => {
			const framework = frameworks.find((f) => f.value === value);
			return framework
				? `${color.cyan(framework.label)} ${color.dim(`- ${framework.hint}`)}`
				: value;
		})
		.join('\n');

	p.log.message(selectedDetails);
	p.outro(`Successfully selected ${color.green(selectedFrameworks.length)} frameworks.`);
}

main().catch(console.error);
