import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { autocomplete } from './autocomplete.js';
import type { CommonOptions } from './common.js';

/**
 * Options for the {@link path} component.
 */
export interface PathOptions extends CommonOptions {
	/**
	 * Root directory for path selection.
	 */
	root?: string;

	/**
	 * If `true`, only directories will be shown in the suggestions.
	 */
	directory?: boolean;

	/**
	 * Initial value for the input field. Falls back to `root` or the current working directory.
	 */
	initialValue?: string;

	/**
	 * The message to display to the user.
	 */
	message: string;

	/**
	 * A validation function to check the selected path.
	 * Receives the current input value and should return `undefined` for valid input,
	 * or a string/error message for invalid input.
	 */
	validate?: (value: string | undefined) => string | Error | undefined;
}

/**
 * The `path` prompt allows selecting a file or directory path from the filesystem.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#path-selection
 *
 * @example
 * ```ts
 * import { path } from '@clack/prompts';
 *
 * const result = await path({
 *   message: 'Select a file:',
 *   root: process.cwd(),
 *   directory: false,
 * });
 * ```
 */
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
					if (stat.isDirectory() && (!opts.directory || userInput.endsWith('/'))) {
						searchPath = userInput;
					} else {
						searchPath = dirname(userInput);
					}
				}

				// Strip trailing slash so startsWith matches the directory itself among its siblings
				const prefix =
					userInput.length > 1 && userInput.endsWith('/') ? userInput.slice(0, -1) : userInput;

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
						({ path, isDirectory }) => path.startsWith(prefix) && (isDirectory || !opts.directory)
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
