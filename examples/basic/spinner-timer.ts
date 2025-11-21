import * as p from '@clack/prompts';

p.intro('spinner start...');

async function main() {
	const spin = p.spinner({ indicator: 'timer' });

	spin.start('First spinner');

	await sleep(3_000);

	spin.stop('Done first spinner');

	spin.start('Second spinner');
	await sleep(5_000);

	spin.stop('Done second spinner');

	p.outro('spinner stop.');
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
