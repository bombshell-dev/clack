import type { Writable } from 'node:stream';
import { styleText } from 'node:util';
import { settings } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, S_BAR_START } from './common.js';

/**
 * Display a red cancel message with a visual prefix.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#messages
 *
 * @example
 * ```ts
 * import { cancel } from '@clack/prompts';
 *
 * cancel('Installation canceled');
 * ```
 */
export const cancel = (message = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const hasGuide = opts?.withGuide ?? settings.withGuide;
	const prefix = hasGuide ? `${styleText('gray', S_BAR_END)}  ` : '';
	output.write(`${prefix}${styleText('red', message)}\n\n`);
};

/**
 * Display an introductory message with a visual prefix.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#messages
 *
 * @example
 * ```ts
 * import { intro } from '@clack/prompts';
 *
 * intro('Welcome to clack');
 * ```
 */
export const intro = (title = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const hasGuide = opts?.withGuide ?? settings.withGuide;
	const prefix = hasGuide ? `${styleText('gray', S_BAR_START)}  ` : '';
	output.write(`${prefix}${title}\n`);
};

/**
 * Display a closing message with a visual suffix.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#messages
 *
 * @example
 * ```ts
 * import { outro } from '@clack/prompts';
 *
 * outro('All operations are finished');
 * ```
 */
export const outro = (message = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const hasGuide = opts?.withGuide ?? settings.withGuide;
	const prefix = hasGuide ? `${styleText('gray', S_BAR)}\n${styleText('gray', S_BAR_END)}  ` : '';
	output.write(`${prefix}${message}\n\n`);
};
