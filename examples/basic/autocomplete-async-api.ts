import * as p from '@clack/prompts';
import color from 'picocolors';

/**
 * Example demonstrating async autocomplete with API search
 * Uses the REST Countries API to search for countries by name
 */

interface Country {
	code: string;
	name: string;
	region: string;
}

async function searchCountries(query: string, signal?: AbortSignal): Promise<Country[]> {
	if (!query) {
		// Return empty array for empty query
		return [];
	}

	try {
		const response = await fetch(
			`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`,
			{
				signal,
			}
		);

		if (!response.ok) {
			if (response.status === 404) {
				// No countries found
				return [];
			}
			throw new Error(`API error: ${response.status}`);
		}

		const countries: Array<{ cca2: string; name: { common: string }; region: string }> =
			await response.json();

		return countries.map((country) => ({
			code: country.cca2,
			name: country.name.common,
			region: country.region,
		}));
	} catch (error) {
		// If request was aborted, return empty array
		if (signal?.aborted) {
			return [];
		}
		throw error;
	}
}

async function main() {
	console.clear();

	p.intro(`${color.bgCyan(color.black(' Async Autocomplete - API Search '))}`);

	p.note(
		`
${color.cyan('This example demonstrates async autocomplete with API search:')}
- Type to search countries via ${color.yellow('REST Countries API')}
- Search is ${color.yellow('debounced')} to avoid excessive requests
- Previous requests are ${color.yellow('cancelled')} when you type more
- Shows ${color.yellow('loading spinner')} during API calls
- Handles ${color.yellow('errors gracefully')}
  `,
		'Instructions'
	);

	const result = await p.autocomplete<Country>({
		message: 'Search for a country',
		filteredOptions: async (query, signal) => {
			const countries = await searchCountries(query, signal);
			return countries.map((country) => ({
				value: country,
				label: country.name,
				hint: country.region,
			}));
		},
		debounce: 300, // Wait 300ms after user stops typing
	});

	if (p.isCancel(result)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	// Display result
	const country = result as Country;
	p.note(
		`
${color.green('Name:')} ${country.name}
${color.green('Code:')} ${country.code}
${color.green('Region:')} ${country.region}
    `,
		'Selected Country'
	);

	p.outro('Done!');
}

main().catch(console.error);
