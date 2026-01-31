import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
	const result = await p.date({
		message: color.magenta('Pick a date'),
		format: 'YYYY/MM/DD',
	});

	const secondResult = await p.date({
		message: color.magenta('Modify this date:'),
		format: 'YYYY/MM/DD',
		defaultValue: '2025-01-01',
	});

	if (p.isCancel(result) || p.isCancel(secondResult)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	p.outro(`Selected dates: ${color.cyan(result)} and ${color.cyan(secondResult)}`);
}

main().catch(console.error);
