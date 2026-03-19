import { setTimeout } from 'node:timers/promises';
import type { ProgressResult } from '@clack/prompts';
import * as p from '@clack/prompts';

async function fakeProgress(progressbar: ProgressResult): Promise<void> {
	await setTimeout(1000);
	for (const _i in Array(10).fill(1)) {
		progressbar.advance();
		await setTimeout(100 + Math.random() * 500);
	}
}

async function demo() {
	p.intro('progress start...');

	const download = p.progress({ style: 'block', max: 10, size: 30 });
	download.start('Downloading package');
	await fakeProgress(download);
	download.stop('Download completed');

	const unarchive = p.progress({ style: 'heavy', max: 10, size: 30, indicator: undefined });
	unarchive.start('Un-archiving');
	await fakeProgress(unarchive);
	unarchive.stop('Un-archiving completed');

	const linking = p.progress({ style: 'light', max: 10, size: 30, indicator: 'timer' });
	linking.start('Linking');
	await fakeProgress(linking);
	linking.stop('Package linked');

	p.outro('progress stop...');
}

void demo();
