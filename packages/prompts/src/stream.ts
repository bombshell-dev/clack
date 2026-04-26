import { stripVTControlCharacters as strip, styleText } from 'node:util';
import { S_BAR, S_ERROR, S_INFO, S_STEP_SUBMIT, S_SUCCESS, S_WARN } from './common.js';
import type { LogMessageOptions } from './log.js';

const prefix = `${styleText('gray', S_BAR)}  `;

// TODO (43081j): this currently doesn't support custom `output` writables
// because we rely on `columns` existing (i.e. `process.stdout.columns).
//
// If we want to support `output` being passed in, we will need to use
// a condition like `if (output insance Writable)` to check if it has columns

/**
 * Stream output from async iterables to the console with a visual prefix.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#stream
 *
 * @example
 * ```ts
 * import { stream } from '@clack/prompts';
 *
 * await stream.message(['line 1', 'line 2', 'line 3']);
 * await stream.info(['Information line']);
 * await stream.success(['Success line']);
 * ```
 */
export const stream = {
	/**
	 * Stream message with a gray bar prefix.
	 */
	message: async (
		iterable: Iterable<string> | AsyncIterable<string>,
		{ symbol = styleText('gray', S_BAR) }: LogMessageOptions = {}
	) => {
		process.stdout.write(`${styleText('gray', S_BAR)}\n${symbol}  `);
		let lineWidth = 3;
		for await (let chunk of iterable) {
			chunk = chunk.replace(/\n/g, `\n${prefix}`);
			if (chunk.includes('\n')) {
				lineWidth = 3 + strip(chunk.slice(chunk.lastIndexOf('\n'))).length;
			}
			const chunkLen = strip(chunk).length;
			if (lineWidth + chunkLen < process.stdout.columns) {
				lineWidth += chunkLen;
				process.stdout.write(chunk);
			} else {
				process.stdout.write(`\n${prefix}${chunk.trimStart()}`);
				lineWidth = 3 + strip(chunk.trimStart()).length;
			}
		}
		process.stdout.write('\n');
	},

	/**
	 * Stream info message with a blue info symbol.
	 */
	info: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: styleText('blue', S_INFO) });
	},

	/**
	 * Stream success message with a green check mark.
	 */
	success: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: styleText('green', S_SUCCESS) });
	},

	/**
	 * Stream step message with a green check mark.
	 */
	step: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: styleText('green', S_STEP_SUBMIT) });
	},

	/**
	 * Stream warning message with a yellow warning symbol.
	 */
	warn: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: styleText('yellow', S_WARN) });
	},

	/**
	 * Alias for {@link stream.warn}.
	 */
	warning: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.warn(iterable);
	},

	/**
	 * Stream error message with a red error symbol.
	 */
	error: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: styleText('red', S_ERROR) });
	},
};
