import * as p from '@clack/prompts';

async function main() {
	console.clear();
	p.select({
		options: [{ value: 'basic', label: 'Basic' }],
		message: 'Select an example to run.',
		enableFilter: true,
	});
}

main().catch(console.error);
