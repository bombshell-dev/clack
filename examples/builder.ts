import * as p from '@clack/prompts';

(async () => {
	const results = await p
		.builder()
		.add('path', () =>
			p.text({
				message: 'Where should we create your project?',
				placeholder: './sparkling-solid',
				validate: (value) => {
					if (!value) return 'Please enter a path.';
					if (value[0] !== '.') return 'Please enter a relative path.';
				},
			})
		)
		.add('password', () =>
			p.password({
				message: 'Provide a password',
				validate: (value) => {
					if (!value) return 'Please enter a password.';
					if (value.length < 5) return 'Password should have at least 5 characters.';
				},
			})
		)
		.add('type', ({ results }) =>
			p.select({
				message: `Pick a project type within "${results.path}"`,
				initialValue: 'ts',
				maxItems: 5,
				options: [
					{ value: 'ts', label: 'TypeScript' },
					{ value: 'js', label: 'JavaScript' },
					{ value: 'rust', label: 'Rust' },
					{ value: 'go', label: 'Go' },
					{ value: 'python', label: 'Python' },
					{ value: 'coffee', label: 'CoffeeScript', hint: 'oh no' },
				],
			})
		)
		.add('tools', () =>
			p.multiselect({
				message: 'Select additional tools.',
				initialValues: ['prettier', 'eslint'],
				options: [
					{ value: 'prettier', label: 'Prettier', hint: 'recommended' },
					{ value: 'eslint', label: 'ESLint', hint: 'recommended' },
					{ value: 'stylelint', label: 'Stylelint' },
					{ value: 'gh-action', label: 'GitHub Action' },
				],
			})
		)
		.add('install', ({ results }) =>
			p.confirm({
				message: 'Install dependencies?',
				initialValue: false,
			})
		)
		.run();

	await p
		.builder()
		.add('cancel', () => p.text({ message: 'Try cancel prompt (Ctrl + C):' }))
		.add('afterCancel', () => p.text({ message: 'This will not appear!' }))
		.onCancel(({ results }) => {
			p.cancel('Builder canceled');
			process.exit(0);
		})
		.run();
})();
