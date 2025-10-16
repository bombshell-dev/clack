import type { Writable } from 'node:stream';
import { Component, RenderHost } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, S_BAR, S_ERROR, S_STEP_SUBMIT, S_SUCCESS } from './common.js';

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
	header?: string;
	value: string;
	full: string;
	result?: {
		status: 'success' | 'error';
		message: string;
	};
}

class TaskLogComponent extends Component {
	#options: TaskLogOptions;
	#buffers: BufferEntry[] = [
		{
			value: '',
			full: '',
		},
	];
	#lastMessageWasRaw = new WeakMap<BufferEntry, boolean>();
	#completedMessage?: {
		status: 'success' | 'error';
		message: string;
		opts?: TaskLogCompletionOptions;
	};

	constructor(opts: TaskLogOptions) {
		super(undefined);
		this.#options = opts;
	}

	#renderBufferResult(buffer: BufferEntry): string[] {
		if (!buffer.result) {
			return [];
		}

		const secondarySymbol = color.gray(S_BAR);
		const successSymbol = color.green(S_SUCCESS);
		const errorSymbol = color.red(S_ERROR);
		const retainLog = this.#options.retainLog === true;
		const bufferLines: string[] = [];

		if (buffer.result.status === 'error') {
			bufferLines.push(
				`${errorSymbol}  ${buffer.result.message.split('\n').join(`\n${secondarySymbol}`)}`
			);
		} else {
			if (retainLog || buffer.value === '') {
				bufferLines.push(
					`${successSymbol}  ${buffer.result.message.split('\n').join(`\n${secondarySymbol}`)}`
				);
			}
		}

		return bufferLines;
	}

	#renderBuffer(buffer: BufferEntry, full?: boolean): string[] {
		const secondarySymbol = color.gray(S_BAR);
		const bufferLines: string[] = [];

		if (buffer.header !== undefined && buffer.header !== '') {
			bufferLines.push(
				`${secondarySymbol}  ${buffer.header
					.split('\n')
					.map((line) => color.bold(line))
					.join(`\n${secondarySymbol}`)}`
			);
		}
		const messages = full && buffer.full ? `${buffer.full}\n${buffer.value}` : buffer.value;
		if (messages !== '') {
			bufferLines.push(
				`${secondarySymbol}  ${messages
					.split('\n')
					.map((line) => color.dim(line))
					.join(`\n${secondarySymbol}  `)}`
			);
		}
		return bufferLines;
	}

	render(): string {
		const secondarySymbol = color.gray(S_BAR);
		const successSymbol = color.green(S_SUCCESS);
		const errorSymbol = color.red(S_ERROR);
		const spacing = this.#options.spacing ?? 1;
		const bufferLines: string[] = [];

		for (let i = 0; i < spacing; i++) {
			bufferLines.push(secondarySymbol);
		}

		if (this.#completedMessage) {
			bufferLines.push(
				`${this.#completedMessage.status === 'success' ? successSymbol : errorSymbol}  ${this.#completedMessage.message
					.split('\n')
					.join(`\n${secondarySymbol}  `)}`
			);
			if (this.#completedMessage.opts?.showLog) {
				for (const buffer of this.#buffers) {
					const contentLines = this.#renderBuffer(buffer, true);
					for (const line of contentLines) {
						bufferLines.push(line);
					}
				}
			}
		} else {
			for (const buffer of this.#buffers) {
				if (buffer.result) {
					const resultLines = this.#renderBufferResult(buffer);
					for (const line of resultLines) {
						bufferLines.push(line);
					}
				} else {
					const contentLines = this.#renderBuffer(buffer);
					for (const line of contentLines) {
						bufferLines.push(line);
					}
				}
			}
		}

		return `
${secondarySymbol}
${color.green(S_STEP_SUBMIT)}  ${this.#options.title}
${bufferLines.join('\n')}
		`.trim();
	}

	closeGroup(name: string, status: 'success' | 'error', message: string): void {
		const buffer = this.#buffers.find((b) => b.header === name);
		if (!buffer) {
			return;
		}
		buffer.result = {
			status,
			message,
		};
		this.requestUpdate();
	}

	message(msg: string, opts?: TaskLogMessageOptions, bufferName?: string): void {
		const retainLog = this.#options.retainLog === true;
		const buffer = bufferName
			? this.#buffers.find((b) => b.header === bufferName)
			: this.#buffers[0];
		if (!buffer) {
			return;
		}
		const lastMessageWasRaw = this.#lastMessageWasRaw.get(buffer) ?? false;
		if ((opts?.raw !== true || !lastMessageWasRaw) && buffer.value !== '') {
			buffer.value += '\n';
		}
		buffer.value += msg;
		this.#lastMessageWasRaw.set(buffer, opts?.raw === true);
		if (this.#options.limit !== undefined) {
			const lines = buffer.value.split('\n');
			const linesToRemove = lines.length - this.#options.limit;
			if (linesToRemove > 0) {
				const removedLines = lines.splice(0, linesToRemove);
				if (retainLog) {
					buffer.full += (buffer.full === '' ? '' : '\n') + removedLines.join('\n');
				}
			}
			buffer.value = lines.join('\n');
		}
		this.requestUpdate();
	}

	group(name: string): void {
		const buffer: BufferEntry = {
			header: name,
			value: '',
			full: '',
		};
		this.#buffers.push(buffer);
	}

	error(message: string, opts?: TaskLogCompletionOptions): void {
		this.#completedMessage = {
			status: 'error',
			message,
			opts,
		};
		this.requestUpdate();
	}

	success(message: string, opts?: TaskLogCompletionOptions): void {
		this.#completedMessage = {
			status: 'success',
			message,
			opts,
		};
		this.requestUpdate();
	}
}

/**
 * Renders a log which clears on success and remains on failure
 */
export const taskLog = (opts: TaskLogOptions) => {
	const output: Writable = opts.output ?? process.stdout;
	const host = new RenderHost(output);
	const component = new TaskLogComponent(opts);
	host.attach(component);
	host.requestUpdate();

	return {
		message(msg: string, mopts?: TaskLogMessageOptions) {
			component.message(msg, mopts);
		},
		group(name: string) {
			component.group(name);
			return {
				message(msg: string, mopts?: TaskLogMessageOptions) {
					component.message(msg, mopts, name);
				},
				error(message: string) {
					component.closeGroup(name, 'error', message);
				},
				success(message: string) {
					component.closeGroup(name, 'success', message);
				},
			};
		},
		error(message: string, opts?: TaskLogCompletionOptions): void {
			component.error(message, opts);
		},
		success(message: string, opts?: TaskLogCompletionOptions): void {
			component.success(message, opts);
		},
	};
};
