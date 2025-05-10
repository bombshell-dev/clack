import * as p from '@clack/prompts';

async function demo() {
	p.intro('path start...');

	const path = await p.path({
		message: 'Read file',
	});

	p.outro('path stop...');
}

void demo();
