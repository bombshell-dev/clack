import { setTimeout as sleep } from 'node:timers/promises';
import * as p from '@clack/prompts';

async function main() {
	p.intro('Advanced Spinner Cancellation Demo');

	// First demonstrate a visible spinner with no user input needed
	p.note('First, we will show a basic spinner (press CTRL+C to cancel)', 'Demo Part 1');

	const demoSpinner = p.spinner({
		indicator: 'dots',
		onCancel: () => {
			p.note('Initial spinner was cancelled with CTRL+C', 'Demo Cancelled');
		},
	});

	demoSpinner.start('Loading demo resources');

	// Update spinner message a few times to show activity
	for (let i = 0; i < 5; i++) {
		if (demoSpinner.isCancelled) break;
		await sleep(1000);
		demoSpinner.message(`Loading demo resources (${i + 1}/5)`);
	}

	if (!demoSpinner.isCancelled) {
		demoSpinner.stop('Demo resources loaded successfully');
	}

	// Only continue with the rest of the demo if the initial spinner wasn't cancelled
	if (!demoSpinner.isCancelled) {
		// Stage 1: Get user input with multiselect
		p.note("Now let's select some languages to process", 'Demo Part 2');

		const languages = await p.multiselect({
			message: 'Select programming languages to process:',
			options: [
				{ value: 'typescript', label: 'TypeScript' },
				{ value: 'javascript', label: 'JavaScript' },
				{ value: 'python', label: 'Python' },
				{ value: 'rust', label: 'Rust' },
				{ value: 'go', label: 'Go' },
			],
			required: true,
		});

		// Handle cancellation of the multiselect
		if (p.isCancel(languages)) {
			p.cancel('Operation cancelled during language selection.');
			process.exit(0);
		}

		// Stage 2: Show a spinner that can be cancelled
		const processSpinner = p.spinner({
			indicator: 'dots',
			onCancel: () => {
				p.note(
					'You cancelled during processing. Any completed work will be saved.',
					'Processing Cancelled'
				);
			},
		});

		processSpinner.start('Starting to process selected languages...');

		// Process each language with individual progress updates
		let completedCount = 0;
		const totalLanguages = languages.length;

		for (const language of languages) {
			// Skip the rest if cancelled
			if (processSpinner.isCancelled) break;

			// Update spinner message with current language
			processSpinner.message(`Processing ${language} (${completedCount + 1}/${totalLanguages})`);

			try {
				// Simulate work - longer pause to give time to test CTRL+C
				await sleep(2000);
				completedCount++;
			} catch (error) {
				// Handle errors but continue if not cancelled
				if (!processSpinner.isCancelled) {
					p.note(`Error processing ${language}: ${error.message}`, 'Error');
				}
			}
		}

		// Stage 3: Handle completion based on cancellation status
		if (!processSpinner.isCancelled) {
			processSpinner.stop(`Processed ${completedCount}/${totalLanguages} languages successfully`);

			// Stage 4: Additional user input based on processing results
			if (completedCount > 0) {
				const action = await p.select({
					message: 'What would you like to do with the processed data?',
					options: [
						{ value: 'save', label: 'Save results', hint: 'Write to disk' },
						{ value: 'share', label: 'Share results', hint: 'Upload to server' },
						{ value: 'analyze', label: 'Further analysis', hint: 'Generate reports' },
					],
				});

				if (p.isCancel(action)) {
					p.cancel('Operation cancelled at final stage.');
					process.exit(0);
				}

				// Stage 5: Final action with a timer spinner
				p.note('Now demonstrating a timer-style spinner', 'Final Stage');

				const finalSpinner = p.spinner({
					indicator: 'timer', // Use timer indicator for variety
					onCancel: () => {
						p.note(
							'Final operation was cancelled, but processing results are still valid.',
							'Final Stage Cancelled'
						);
					},
				});

				finalSpinner.start(`Performing ${action} operation...`);

				try {
					// Simulate final action with incremental updates
					for (let i = 0; i < 3; i++) {
						if (finalSpinner.isCancelled) break;
						await sleep(1500);
						finalSpinner.message(`Performing ${action} operation... Step ${i + 1}/3`);
					}

					if (!finalSpinner.isCancelled) {
						finalSpinner.stop(`${action} operation completed successfully`);
					}
				} catch (error) {
					if (!finalSpinner.isCancelled) {
						finalSpinner.stop(`Error during ${action}: ${error.message}`);
					}
				}
			}
		}
	}

	p.outro('Advanced demo completed. Thanks for trying out the spinner cancellation features!');
}

main().catch((error) => {
	console.error('Unexpected error:', error);
	process.exit(1);
});
