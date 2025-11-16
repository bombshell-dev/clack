import * as p from '@clack/prompts';
import color from 'picocolors';

/**
 * Example demonstrating sync autocomplete with custom filtering logic
 * Uses filteredOptions to implement fuzzy matching
 */

interface Package {
	name: string;
	description: string;
	downloads: number;
}

const packages: Package[] = [
	{
		name: 'react',
		description: 'A JavaScript library for building user interfaces',
		downloads: 20000000,
	},
	{ name: 'vue', description: 'Progressive JavaScript Framework', downloads: 5000000 },
	{
		name: 'angular',
		description: 'Platform for building mobile and desktop apps',
		downloads: 3000000,
	},
	{ name: 'svelte', description: 'Cybernetically enhanced web apps', downloads: 1000000 },
	{ name: 'next', description: 'The React Framework for Production', downloads: 8000000 },
	{ name: 'nuxt', description: 'The Intuitive Vue Framework', downloads: 2000000 },
	{ name: 'express', description: 'Fast, unopinionated web framework', downloads: 15000000 },
	{ name: 'fastify', description: 'Fast and low overhead web framework', downloads: 500000 },
	{ name: 'vite', description: 'Next generation frontend tooling', downloads: 4000000 },
	{ name: 'webpack', description: 'Module bundler', downloads: 12000000 },
];

/**
 * Custom fuzzy matching filter
 * Matches if all characters in query appear in order in the name
 */
function fuzzyMatch(query: string, text: string): boolean {
	if (!query) return true;

	const queryChars = query.toLowerCase().split('');
	const textLower = text.toLowerCase();
	let textIndex = 0;

	for (const char of queryChars) {
		const foundIndex = textLower.indexOf(char, textIndex);
		if (foundIndex === -1) return false;
		textIndex = foundIndex + 1;
	}

	return true;
}

async function main() {
	console.clear();

	p.intro(`${color.bgCyan(color.black(' Sync Autocomplete - Custom Filtering '))}`);

	p.note(
		`
${color.cyan('This example demonstrates sync autocomplete with custom filtering:')}
- Uses ${color.yellow('fuzzy matching')} algorithm
- Type partial characters: "${color.yellow('rx')}" matches "${color.green('react')}"
- ${color.yellow('Instant results')} - no debouncing needed for sync
- Also searches in ${color.yellow('descriptions')}
  `,
		'Instructions'
	);

	const result = await p.autocomplete<Package>({
		message: 'Select a package',
		filteredOptions: (query) => {
			// Custom filtering logic with fuzzy matching
			return packages
				.filter((pkg) => fuzzyMatch(query, pkg.name) || fuzzyMatch(query, pkg.description))
				.sort((a, b) => b.downloads - a.downloads) // Sort by popularity
				.map((pkg) => ({
					value: pkg,
					label: pkg.name,
					hint: `${(pkg.downloads / 1000000).toFixed(1)}M downloads`,
				}));
		},
	});

	if (p.isCancel(result)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	// Display result
	const pkg = result as Package;
	p.note(
		`
${color.green('Name:')} ${pkg.name}
${color.green('Description:')} ${pkg.description}
${color.green('Downloads:')} ${(pkg.downloads / 1000000).toFixed(1)}M/month
    `,
		'Selected Package'
	);

	p.outro('Done!');
}

main().catch(console.error);
