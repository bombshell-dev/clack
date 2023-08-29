import * as p from '@clack/prompts';

(async () => {
	const selectResult = await p.path({
		type: 'select',
		message: 'Pick a file:',
		initialValue: process.cwd(),
		onlyShowDir: false,
		maxItems: 15,
	});
	if (p.isCancel(selectResult)) {
		p.cancel('File selection canceled');
		process.exit(0);
	}

	const inputResult = await p.path({
		type: 'text',
		message: 'Pick a file:',
		onlyShowDir: false,
		placeholder: process.cwd(),
	});
	if (p.isCancel(inputResult)) {
		p.cancel('File selection canceled');
		process.exit(0);
	}

	console.log({ selectResult, inputResult });
})();
