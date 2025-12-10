import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
	console.clear();

	p.intro(`${color.bgMagenta(color.black(' Custom Themed CLI '))}`);

	// Custom theme with a purple/violet color scheme
	// Defaults: active=cyan, submit=green, cancel=red, error=yellow
	// Guide defaults: guide=cyan, submit=gray, cancel=gray, error=yellow
	const purpleTheme = {
		formatSymbolActive: (str: string) => color.magenta(str), // default: cyan
		formatSymbolSubmit: (str: string) => color.green(str), // default: green (matching guide)
		formatSymbolCancel: (str: string) => color.red(str), // default: red
		formatSymbolError: (str: string) => color.yellow(str), // default: yellow
		formatGuide: (str: string) => color.magenta(str), // default: cyan
		formatGuideSubmit: (str: string) => color.green(str), // default: gray
		formatGuideCancel: (str: string) => color.red(str), // default: gray - red for cancel
		formatGuideError: (str: string) => color.yellow(str), // default: yellow
		formatErrorMessage: (str: string) => color.red(str), // default: yellow
	};

	const name = await p.text({
		message: 'What is your project name?',
		placeholder: 'my-awesome-project',
		theme: purpleTheme,
		validate: (value) => {
			if (!value) return 'Project name is required';
			if (value.includes(' ')) return 'Project name cannot contain spaces';
		},
	});

	if (p.isCancel(name)) {
		p.cancel('Setup cancelled.');
		process.exit(0);
	}

	const description = await p.text({
		message: 'Describe your project in a few words:',
		placeholder: 'A blazing fast CLI tool',
		theme: purpleTheme,
	});

	if (p.isCancel(description)) {
		p.cancel('Setup cancelled.');
		process.exit(0);
	}

	const author = await p.text({
		message: 'Who is the author?',
		placeholder: 'Your Name <you@example.com>',
		theme: purpleTheme,
		validate: (value) => {
			if (!value) return 'Author is required';
		},
	});

	if (p.isCancel(author)) {
		p.cancel('Setup cancelled.');
		process.exit(0);
	}

	p.note(
		`Name: ${color.cyan(name as string)}\nDescription: ${color.cyan((description as string) || 'N/A')}\nAuthor: ${color.cyan(author as string)}`,
		'Project Summary'
	);

	p.outro(`${color.green('✓')} Project ${color.magenta(name as string)} configured!`);
}

main().catch(console.error);
