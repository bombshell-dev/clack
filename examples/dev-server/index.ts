import { wrap } from '@clack/core';
import { stdin, stdout } from 'node:process';
import * as readline from 'readline';
import { cursor, erase } from 'sisteransi';
import color from 'picocolors';

function createLogger({ input = stdin, output = stdout } = {}) {
	let previousLineCount = 0;
	let previousWidth = output.columns ?? 80;
	let previousFormatted = '';

	function log(message = '') {
		const width = output.columns ?? 80;
		let formatted = wrap(message, width) + '\n'
		let currLineCount = formatted.split('\n').length;
		if (previousLineCount > 0 && currLineCount > previousLineCount) {
			previousLineCount = wrap(previousFormatted, width).split('\n').length;
		}
		if (formatted === previousFormatted && previousWidth === width) {
			return;
		}
		previousFormatted = formatted;
		previousWidth = width;

		output.write(erase.lines(previousLineCount) + formatted);
		previousLineCount = formatted.split('\n').length;
	}

	return { log };
}

const paragraph = `Lorem ipsum dolor sit ${color.red('amet')}, ${color.green('consectetur')} adipiscing elit. Fusce sed urna a ${color.inverse(' sem ')} aliquet efficitur sit amet quis turpis.\n\nDonec consectetur neque eget consequat ultricies. Integer ornare ipsum quis maximus tempor. Fusce quis sem eget dolor maximus sollicitudin quis sodales enim. Mauris a finibus risus, vitae porta dolor. Aliquam nec dui vitae dui fermentum dictum eget mattis mauris. Suspendisse condimentum sodales nisl, quis vestibulum dolor pretium vel. Etiam dignissim maximus leo, eget auctor felis congue non. Vestibulum venenatis mi sapien, nec sagittis dui finibus quis. Ut neque lacus, vestibulum nec congue non, finibus in lorem. Cras consectetur, neque non pretium luctus, orci massa auctor orci, id scelerisque velit mi quis erat. Proin a nibh placerat, sollicitudin dui ut, pretium nisi.`;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: ''
});

async function main() {
	const logger = createLogger();
	logger.log(paragraph)
	process.stdout.on('resize', () => logger.log(paragraph))
}

main();
