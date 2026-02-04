import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
	const result = (await p.date({
		message: color.magenta('Pick a date'),
		format: 'DD/MM/YYYY',
	})) as Date;

	const fmt = (d: Date) => d.toISOString().slice(0, 10);
	p.outro(`Selected date: ${color.cyan(fmt(result))}`);
}

main().catch(console.error);
