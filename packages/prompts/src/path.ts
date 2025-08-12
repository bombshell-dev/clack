import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { autocomplete } from './autocomplete.js';
import type { CommonOptions } from './common.js';

export interface PathOptions extends CommonOptions {
	root?: string;
	directory?: boolean;
	initialValue?: string;
	message: string;
	validate?: (value: string | undefined) => string | Error | undefined;
}

export const path = (opts: PathOptions) => {
	const validate = opts.validate;

	return autocomplete({
		...opts,
		initialUserInput: opts.initialValue ?? opts.root ?? process.cwd(),
		maxItems: 5,
		validate(value) {
			if (Array.isArray(value)) {
				// Shouldn't ever happen since we don't enable `multiple: true`
				return undefined;
			}
			if (!value) {
				return 'Please select a path';
			}
			if (validate) {
				return validate(value);
			}
			return undefined;
		},
		options() {
			const userInput = this.userInput;
			if (userInput === '') {
				return [];
			}

			try {
				let searchPath: string;

				if (!existsSync(userInput)) {
					searchPath = dirname(userInput);
				} else {
					const stat = lstatSync(userInput);
					if (stat.isDirectory()) {
						searchPath = userInput;
					} else {
						searchPath = dirname(userInput);
					}
				}

				const items = readdirSync(searchPath)
					.map((item) => {
						const path = join(searchPath, item);
						const stats = lstatSync(path);
						return {
							name: item,
							path,
							isDirectory: stats.isDirectory(),
						};
					})
					.filter(
						({ path, isDirectory }) =>
							path.startsWith(userInput) && (opts.directory || !isDirectory)
					);
				return items.map((item) => ({
					value: item.path,
				}));
			} catch (_e) {
				return [];
			}
		},
	});
};
