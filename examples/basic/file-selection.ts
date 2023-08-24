import * as p from '@clack/prompts';

(async () => {
	const path = await p.path({
		message: 'Pick a file:',
		onlyShowDir: false,
		initialValue: process.cwd(),
		maxItems: 15,
	});
	if (p.isCancel(path)) {
		p.cancel('File selection canceled');
		process.exit(0);
	}
	p.outro(path);
})();
