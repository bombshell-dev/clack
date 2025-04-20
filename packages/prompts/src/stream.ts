import { appendRenderer } from '@clack/core';
import color from 'picocolors';
import { S_BAR, S_ERROR, S_INFO, S_STEP_SUBMIT, S_SUCCESS, S_WARN } from './common.js';
import type { LogMessageOptions } from './log.js';

const prefix = `${color.gray(S_BAR)}  `;

export const stream = {
	message: async (
		iterable: Iterable<string> | AsyncIterable<string>,
		{ symbol = color.gray(S_BAR), output = process.stdout }: LogMessageOptions = {}
	) => {
		output.write(`${color.gray(S_BAR)}\n${symbol}  `);
		const renderer = appendRenderer(output, prefix);
		for await (const chunk of iterable) {
			renderer(chunk);
		}
		output.write('\n');
	},
	info: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: color.blue(S_INFO) });
	},
	success: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: color.green(S_SUCCESS) });
	},
	step: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: color.green(S_STEP_SUBMIT) });
	},
	warn: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: color.yellow(S_WARN) });
	},
	/** alias for `log.warn()`. */
	warning: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.warn(iterable);
	},
	error: (iterable: Iterable<string> | AsyncIterable<string>) => {
		return stream.message(iterable, { symbol: color.red(S_ERROR) });
	},
};
