import * as p from '@clack/prompts';

p.intro('spinner start...');

const spin = p.spinner();
const totalDuration = 10_000;

spin.start('Loading', { indicator: 'timer' });

new Promise((resolve) => {
	setTimeout(() => {
		resolve(true);
	}, totalDuration);
}).then(() => {
	spin.stop('Done');
	p.outro('spinner stop...');
});
