import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
	console.clear();

	await setTimeout(1000);

	p.intro(`${color.bgCyan(color.black(' create-app '))}`);

	await p.stream.step(
		(async function* () {
			for (const line of lorem) {
				for (const word of line.split(' ')) {
					yield word;
					yield ' ';
					await setTimeout(200);
				}
				yield '\n';
				if (line !== lorem.at(-1)) {
					await setTimeout(1000);
				}
			}
		})()
	);

	p.outro(`Problems? ${color.underline(color.cyan('https://example.com/issues'))}`);
}

const lorem = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
	'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
];

main().catch(console.error);
