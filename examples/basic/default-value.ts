import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
	const defaultPath = 'my-project';

	const result = await p.text({
		message: 'Enter the directory to bootstrap the project',
		placeholder: `  (hit Enter to use '${defaultPath}')`,
		defaultValue: defaultPath,
		validate: (value) => {
			if (!value) {
				return 'Directory is required';
			}
			if (value.includes(' ')) {
				return 'Directory cannot contain spaces';
			}
			return undefined;
		},
	});

	if (p.isCancel(result)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}

	p.outro(`Let's bootstrap the project in ${color.cyan(result)}`);
}

main().catch(console.error);
