import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
	const result = (await p.date({
		message: color.magenta('Pick a date'),
		format: 'YYYY/MM/DD',
		minDate: new Date('2025-01-01'),
		maxDate: new Date('2025-12-31'),
	})) as Date;

	if (p.isCancel(result)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	const fmt = (d: Date) => d.toISOString().slice(0, 10);
	p.outro(`Selected date: ${color.cyan(fmt(result))}`);
}

main().catch(console.error);
