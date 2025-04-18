import { getColumns } from '@clack/core';
import { wrap } from '@macfja/ansi';
import color from 'picocolors';
import { cursor, erase } from 'sisteransi';
import {
	type CommonOptions,
	S_BAR,
	S_ERROR,
	S_INFO,
	S_STEP_SUBMIT,
	S_SUCCESS,
	S_WARN,
} from './common.js';

export interface LogMessageOptions extends CommonOptions {
	symbol?: string;
	spacing?: number;
	secondarySymbol?: string;
	removeLeadingSpace?: boolean;
}

export const log = {
	message: async (
		message: string | Iterable<string> | AsyncIterable<string> = [],
		{
			symbol = color.gray(S_BAR),
			spacing = 0,
			secondarySymbol = color.gray(S_BAR),
			output = process.stdout,
			removeLeadingSpace = true,
		}: LogMessageOptions = {}
	) => {
		output.write(`${color.gray(S_BAR)}\n`);
		let first = true;
		let lastLine = '';
		const iterable = typeof message === 'string' ? [message] : message;
		const isAsync = Symbol.asyncIterator in iterable;
		for await (let chunk of iterable) {
			const width = getColumns(output);
			if (first) {
				lastLine = `${symbol}  `;
				chunk = '\n'.repeat(spacing) + chunk;
				first = false;
			}
			const newLineRE = removeLeadingSpace ? /\n */g : /\n/g;
			const lines =
				lastLine.substring(0, 3) +
				wrap(`${lastLine.substring(3)}${chunk}`, width).replace(
					newLineRE,
					`\n${secondarySymbol}  `
				);
			output?.write(cursor.move(-999, 0) + erase.lines(1));
			output?.write(lines);
			lastLine = lines.substring(Math.max(0, lines.lastIndexOf('\n') + 1));
			if (!isAsync) {
				lastLine = `${secondarySymbol}  `;
				output?.write('\n');
			}
		}
		if (isAsync) {
			output.write('\n');
		}
	},
	info: async (message: string, opts?: LogMessageOptions) => {
		await log.message(message, { ...opts, symbol: color.blue(S_INFO) });
	},
	success: async (message: string, opts?: LogMessageOptions) => {
		await log.message(message, { ...opts, symbol: color.green(S_SUCCESS) });
	},
	step: async (message: string, opts?: LogMessageOptions) => {
		await log.message(message, { ...opts, symbol: color.green(S_STEP_SUBMIT) });
	},
	warn: async (message: string, opts?: LogMessageOptions) => {
		await log.message(message, { ...opts, symbol: color.yellow(S_WARN) });
	},
	/** alias for `log.warn()`. */
	warning: async (message: string, opts?: LogMessageOptions) => {
		await log.warn(message, opts);
	},
	error: async (message: string, opts?: LogMessageOptions) => {
		await log.message(message, { ...opts, symbol: color.red(S_ERROR) });
	},
};

export const stream = log;
