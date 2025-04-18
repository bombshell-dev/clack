import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
	console.clear();

	await setTimeout(1000);

	p.intro(`${color.bgCyan(color.black(' create-app '))}`);

	await p.log.message('Entering directory "src"');
	await p.log.info('No files to update');
	await p.log.warn('Directory is empty, skipping');
	await p.log.warning('Directory is empty, skipping');
	await p.log.error('Permission denied on file src/secret.js');
	await p.log.success('Installation complete');
	await p.log.step('Check files');
	await p.log.step('Line 1\nLine 2');
	await p.log.step(['Line 1 (array)', 'Line 2 (array)']);

	p.outro(`Problems? ${color.underline(color.cyan('https://example.com/issues'))}`);
}

main().catch(console.error);
