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
	primary: boolean;
	value: string;
	full: string;
	result?: {
		status: 'success' | 'error';
		message: string;
	};
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

	const buffers: BufferEntry[] = [
		{
			primary: true,
			value: '',
			full: '',
		},
	];
	let lastMessageWasRaw = false;

	const clear = (clearTitle: boolean): void => {
		if (buffers.length === 0) {
			return;
		}

		let lines = 0;

		if (clearTitle) {
			lines += spacing + 2;
		}

		for (const { value } of buffers) {
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
		for (const { value, full } of buffers) {
			if (retainLog === true && full.length > 0) {
				printBuffer(`${full}\n${value}`);
			} else {
				printBuffer(value);
			}
		}
	};
	const message = (buffer: BufferEntry, msg: string, mopts?: TaskLogMessageOptions) => {
		clear(false);
		if ((mopts?.raw !== true || !lastMessageWasRaw) && buffer.value !== '') {
			buffer.value += '\n';
		}
		buffer.value += msg;
		lastMessageWasRaw = mopts?.raw === true;
		if (opts.limit !== undefined) {
			const lines = buffer.value.split('\n');
			const bufferHeaderHeight = buffer.primary ? 0 : 1;
			const linesToRemove = lines.length - opts.limit - bufferHeaderHeight;
			if (linesToRemove > 0) {
				const removedLines = lines.splice(bufferHeaderHeight, linesToRemove);
				if (retainLog) {
					buffer.full += (buffer.full === '' ? '' : '\n') + removedLines.join('\n');
				}
			}
			buffer.value = lines.join('\n');
		}
		if (isTTY) {
			printBuffers();
		}
	};
	const printBuffers = (): void => {
		for (const buffer of buffers) {
			if (buffer.result) {
				if (buffer.result.status === 'error') {
					log.error(buffer.result.message, { output, secondarySymbol, spacing: 1 });
				} else {
					log.success(buffer.result.message, { output, secondarySymbol, spacing: 1 });
				}
			} else if (buffer.value !== '') {
				printBuffer(buffer.value, 0);
			}
		}
	};
	const completeBuffer = (buffer: BufferEntry, result: BufferEntry['result']): void => {
		clear(false);

		buffer.result = result;
		buffer.value = '';

		if (isTTY) {
			printBuffers();
		}
	};

	return {
		message(msg: string, mopts?: TaskLogMessageOptions) {
			message(buffers[0], msg, mopts);
		},
		group(name: string) {
			const buffer: BufferEntry = {
				primary: false,
				value: '',
				full: '',
			};
			buffers.push(buffer);
			message(buffer, name);
			return {
				message(msg: string, mopts?: TaskLogMessageOptions) {
					message(buffer, msg, mopts);
				},
				error(message: string) {
					completeBuffer(buffer, {
						status: 'error',
						message,
					});
				},
				success(message: string) {
					completeBuffer(buffer, {
						status: 'success',
						message,
					});
				},
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
			buffers[0].full = '';
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
			buffers[0].full = '';
		},
	};
};
