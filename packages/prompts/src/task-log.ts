import type { Writable } from 'node:stream';
import { getColumns } from '@clack/core';
import color from 'picocolors';
import { erase } from 'sisteransi';
import { type CommonOptions, S_BAR, S_STEP_SUBMIT, isTTY as isTTYFn } from './common.js';
import { log } from './log.js';

export interface TaskLogOptions extends CommonOptions {
	title: string;
	limit?: number;
	spacing?: number;
	retainLog?: boolean;
}

export interface TaskLogMessageOptions {
	raw?: boolean;
}

export interface TaskLogCompletionOptions {
	showLog?: boolean;
}

interface BufferEntry {
	value: string;
	full: string;
}

/**
 * Renders a log which clears on success and remains on failure
 */
export const taskLog = (opts: TaskLogOptions) => {
	const output: Writable = opts.output ?? process.stdout;
	const columns = getColumns(output);
	const secondarySymbol = color.gray(S_BAR);
	const spacing = opts.spacing ?? 1;
	const barSize = 3;
	const retainLog = opts.retainLog === true;
	const isTTY = isTTYFn(output);

	output.write(`${secondarySymbol}\n`);
	output.write(`${color.green(S_STEP_SUBMIT)}  ${opts.title}\n`);
	for (let i = 0; i < spacing; i++) {
		output.write(`${secondarySymbol}\n`);
	}

	const buffers: BufferEntry[] = [{
		value: '',
		full: ''
	}];
	let lastMessageWasRaw = false;

	const clear = (clearTitle: boolean): void => {
		if (buffers.length === 0) {
			return;
		}

		let lines = 0;

		if (clearTitle) {
			lines += spacing + 2;
		}

		for (const {value} of buffers) {
			if (value.length === 0) {
				continue;
			}
			const bufferHeight = value.split('\n').reduce((count, line) => {
				if (line === '') {
					return count + 1;
				}
				return count + Math.ceil((line.length + barSize) / columns);
			}, 0);
			lines += bufferHeight + 1;
		}

		output.write(erase.lines(lines));
	};
	const printBuffer = (buf: string, messageSpacing?: number): void => {
		log.message(buf.split('\n').map(color.dim), {
			output,
			secondarySymbol,
			symbol: secondarySymbol,
			spacing: messageSpacing ?? spacing,
		});
	};
	const renderBuffer = (): void => {
		for (const {value, full} of buffers) {
			if (retainLog === true && full.length > 0) {
				printBuffer(`${full}\n${value}`);
			} else {
				printBuffer(value);
			}
		}
	};
	const message = (buffer: BufferEntry = buffers[0], msg: string, mopts?: TaskLogMessageOptions) => {
		clear(false);
		if ((mopts?.raw !== true || !lastMessageWasRaw) && buffer.value !== '') {
			buffer.value += '\n';
		}
		buffer.value += msg;
		lastMessageWasRaw = mopts?.raw === true;
		if (opts.limit !== undefined) {
			const lines = buffer.value.split('\n');
			const linesToRemove = lines.length - opts.limit;
			if (linesToRemove > 0) {
				const removedLines = lines.splice(0, linesToRemove);
				if (retainLog) {
					buffer.full += (buffer.full === '' ? '' : '\n') + removedLines.join('\n');
				}
			}
			buffer.value = lines.join('\n');
		}
		if (isTTY) {
			printBuffer(buffer.value, 0);
		}
	};

	return {
		message(msg: string, mopts?: TaskLogMessageOptions) {
			message(undefined, msg, mopts);
		},
		group(name: string) {
			const buffer: BufferEntry = {
				value: '',
				full: ''
			};
			buffers.push(buffer);
			message(buffer, name);
			return {
				message(msg: string, mopts?: TaskLogMessageOptions) {
					message(buffer, msg, mopts);
				},
				error(message: string, opts?: TaskLogCompletionOptions) {
				},
				success(message: string, opts?: TaskLogCompletionOptions) {
				}
			};
		},
		error(message: string, opts?: TaskLogCompletionOptions): void {
			clear(true);
			log.error(message, { output, secondarySymbol, spacing: 1 });
			if (opts?.showLog !== false) {
				renderBuffer();
			}
			// clear buffer since error is an end state
			buffers.splice(1, buffers.length - 1);
			buffers[0].value = '';
			buffers[1].full = '';
		},
		success(message: string, opts?: TaskLogCompletionOptions): void {
			clear(true);
			log.success(message, { output, secondarySymbol, spacing: 1 });
			if (opts?.showLog === true) {
				renderBuffer();
			}
			// clear buffer since success is an end state
			buffers.splice(1, buffers.length - 1);
			buffers[0].value = '';
			buffers[1].full = '';
		},
	};
};
