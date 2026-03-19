import * as p from '@clack/prompts';

p.intro('Spinner with cancellation detection');

// Example 1: Using onCancel callback
const spin1 = p.spinner({
	indicator: 'dots',
	onCancel: () => {
		p.note('You cancelled the spinner with CTRL-C!', 'Callback detected');
	},
});

spin1.start('Press CTRL-C to cancel this spinner (using callback)');

// Sleep for 10 seconds, allowing time for user to press CTRL-C
await sleep(10000).then(() => {
	// Only show success message if not cancelled
	if (!spin1.isCancelled) {
		spin1.stop('Spinner completed without cancellation');
	}
});

// Example 2: Checking the isCancelled property
p.note('Starting second example...', 'Example 2');

const spin2 = p.spinner({ indicator: 'timer' });
spin2.start('Press CTRL-C to cancel this spinner (polling isCancelled)');

await sleep(10000).then(() => {
	if (spin2.isCancelled) {
		p.note('Spinner was cancelled by the user!', 'Property check');
	} else {
		spin2.stop('Spinner completed without cancellation');
	}
});

p.outro('Example completed');

// Helper function
function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
