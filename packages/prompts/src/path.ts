import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'knip/dist/util/path.js';
import { autocomplete } from './autocomplete.js';
import type { CommonOptions } from './common.js';

export interface PathOptions extends CommonOptions {
	root?: string;
	directory?: boolean;
	initialValue?: string;
	message: string;
	validate?: (value: string) => string | Error | undefined;
}

export const path = (opts: PathOptions) => {
	return autocomplete({
		...opts,
		initialValue: opts.initialValue ?? opts.root ?? process.cwd(),
		maxItems: 5,
		options() {
			const value = this.value;
			const normalisedValue = Array.isArray(value) ? value[0] : value;
			if (typeof normalisedValue !== 'string') {
				return [];
			}
			try {
				const searchPath = !existsSync(normalisedValue)
					? dirname(normalisedValue)
					: normalisedValue;
				if (!lstatSync(searchPath).isDirectory()) {
					return [];
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
							path.startsWith(normalisedValue) && (opts.directory || !isDirectory)
					);
				return items.map((item) => ({
					value: item.path,
				}));
			} catch (e) {
				return [];
			}
		},
	});
};
