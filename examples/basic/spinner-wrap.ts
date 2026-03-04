import * as p from '@clack/prompts';

p.intro('spinner start...');

const barWidth = 3;
const columns = (process.stdout.columns || 80) - barWidth;

async function testCase(subtract = 0) {
	p.log.info(`Testing spinner with message width = terminal columns - ${subtract}...`);

	const spin = p.spinner();

	spin.start();

	// Create a message that fills the width the terminal
	const length = columns - subtract;
	const step = Math.floor(length / 5);

	// Start with full line
	const chars = Array.from({ length }, () => '□');

	// Replace some characters with spaces for better wrapping
	for (let i = step; i < length; i += step) {
		chars[i] = ' ';
	}

	const message = chars.join('');

	spin.message(message);

	await wait(3000);

	spin.stop('Done');
}

async function test() {
	await testCase(0); // Do not subtract anything, output width = terminal columns
	await testCase(2); // Subtract 2
	await testCase(3); // Subtract 3, which is the length of spinner symbols
}

test();

//

function wait(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}
