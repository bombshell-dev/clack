import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { autocomplete } from './autocomplete.js';
import type { CommonOptions } from './common.js';

/**
 * Options for the {@link path} prompt.
 */
export interface PathOptions extends CommonOptions {
	/**
	 * The prompt message or question shown to the user above the input.
	 */
	message: string;

	/**
	 * The starting directory for path suggestions (defaults to current working directory).
	 */
	root?: string;

	/**
	 * When `true` only **directories** appear in suggestions while you navigate.
	 */
	directory?: boolean;

	/**
	 * The starting path shown when the prompt first renders, which users can edit
	 * before submitting. If not provided it will fall back to the given `root`,
	 * or the current working directory.
	 *
	 * In `directory` mode, if the initial value points to a directory that exists,
	 * pressing enter will submit the input instead of jumping to the first child.
	 */
	initialValue?: string;

	/**
	 * A function that validates the given path. Return a `string` or `Error` to show as a
	 * validation error, or `undefined` to accept the result.
	 */
	validate?: (value: string | undefined) => string | Error | undefined;
}

/**
 * The `path` prompt extends `autocomplete` to provide file and directory suggestions.
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
