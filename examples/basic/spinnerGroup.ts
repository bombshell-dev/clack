import * as p from '@clack/prompts';

p.intro('spinner groups start...');

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const s = p.spinner();
s.start('example start');
await sleep(500);
s.stop('example stopped');

await p.spinnerGroup('Outer group', [
	[
		'First sub-task',
		() => sleep(1000),
	],
	[
		'Second sub-task',
		async () => {
			if (process.env.THROW_ERROR) {
				throw new Error(process.env.THROW_ERROR);
			}
			await sleep(1000)
		},
	],
	[
		'Third sub-task',
		() => sleep(1000),
	],
]);

p.outro('spinner group stop...');
