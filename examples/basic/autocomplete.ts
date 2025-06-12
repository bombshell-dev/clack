import * as p from '@clack/prompts';
import { styleText } from 'node:util';

async function main() {
	console.clear();

	p.intro(`${styleText('bgCyan', styleText('black', ' Autocomplete Example '))}`);

	p.note(
		`
${styleText('cyan', 'This example demonstrates the type-ahead autocomplete feature:')}
- ${styleText('yellow', 'Type')} to filter the list in real-time
- Use ${styleText('yellow', 'up/down arrows')} to navigate the filtered results
- Press ${styleText('yellow', 'Enter')} to select the highlighted option
- Press ${styleText('yellow', 'Ctrl+C')} to cancel
  `,
		'Instructions'
	);

	const countries = [
		{ value: 'us', label: 'United States', hint: 'NA' },
		{ value: 'ca', label: 'Canada', hint: 'NA' },
		{ value: 'mx', label: 'Mexico', hint: 'NA' },
		{ value: 'br', label: 'Brazil', hint: 'SA' },
		{ value: 'ar', label: 'Argentina', hint: 'SA' },
		{ value: 'uk', label: 'United Kingdom', hint: 'EU' },
		{ value: 'fr', label: 'France', hint: 'EU' },
		{ value: 'de', label: 'Germany', hint: 'EU' },
		{ value: 'it', label: 'Italy', hint: 'EU' },
		{ value: 'es', label: 'Spain', hint: 'EU' },
		{ value: 'pt', label: 'Portugal', hint: 'EU' },
		{ value: 'ru', label: 'Russia', hint: 'EU/AS' },
		{ value: 'cn', label: 'China', hint: 'AS' },
		{ value: 'jp', label: 'Japan', hint: 'AS' },
		{ value: 'in', label: 'India', hint: 'AS' },
		{ value: 'kr', label: 'South Korea', hint: 'AS' },
		{ value: 'au', label: 'Australia', hint: 'OC' },
		{ value: 'nz', label: 'New Zealand', hint: 'OC' },
		{ value: 'za', label: 'South Africa', hint: 'AF' },
		{ value: 'eg', label: 'Egypt', hint: 'AF' },
	];

	const result = await p.autocomplete({
		message: 'Select a country',
		options: countries,
		placeholder: 'Type to search countries...',
		maxItems: 8,
	});

	if (p.isCancel(result)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	const selected = countries.find((c) => c.value === result);

	if (!selected) {
		p.outro('No country selected.');
		process.exit(1);
	}
	
	p.outro(`You selected: ${styleText('cyan', selected?.label)} (${styleText('yellow', selected?.hint)})`);
}

main().catch(console.error);
