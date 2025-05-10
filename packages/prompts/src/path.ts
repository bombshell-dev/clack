import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'knip/dist/util/path.js';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';
import { suggestion } from './suggestion.js';

export interface PathOptions extends CommonOptions {
	root?: string;
	directory?: boolean;
	initialValue?: string;
	message: string;
	validate?: (value: string) => string | Error | undefined;
}

export const path = (opts: PathOptions) => {
	return suggestion({
		...opts,
		initialValue: opts.initialValue ?? opts.root ?? process.cwd(),
		suggest: (value: string) => {
			const searchPath = !existsSync(value) ? dirname(value) : value;
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
				.filter(({ path }) => path.startsWith(value));
			return ((opts.directory ?? false) ? items.filter((item) => item.isDirectory) : items).map(
				({ path }) => path
			);
		},
	});
};
