import { SpinnerPrompt } from '@clack/core';
import color from 'picocolors';
import {
	type CommonOptions,
	isCI as isCIFn,
	S_BAR,
	S_STEP_CANCEL,
	S_STEP_ERROR,
	S_STEP_SUBMIT,
	unicode,
} from './common.js';

export interface SpinnerOptions extends CommonOptions {
	indicator?: 'dots' | 'timer';
	onCancel?: () => void;
	cancelMessage?: string;
	errorMessage?: string;
	frames?: string[];
	delay?: number;
	styleFrame?: (frame: string) => string;
}

export interface SpinnerResult {
	start(msg?: string): void;
	stop(msg?: string): void;
	cancel(msg?: string): void;
	error(msg?: string): void;
	message(msg?: string): void;
	clear(): void;
	readonly isCancelled: boolean;
}

const defaultStyleFn: SpinnerOptions['styleFrame'] = color.magenta;

export const spinner = ({
	indicator = 'dots',
	onCancel,
	cancelMessage,
	errorMessage,
	frames = unicode ? ['◒', '◐', '◓', '◑'] : ['•', 'o', 'O', '0'],
	delay = unicode ? 80 : 120,
	...opts
}: SpinnerOptions = {}): SpinnerResult => {
	const isCI = isCIFn();
	const styleFn = opts?.styleFrame ?? defaultStyleFn;
	const prompt = new SpinnerPrompt({
		indicator,
		onCancel,
		cancelMessage,
		errorMessage,
		frames,
		delay,
		output: opts.output,
		signal: opts.signal,
		input: opts.input,
		render() {
			if (!this.isActive) {
				if (this.silentExit) {
					return '';
				}
				const step =
					this.exitCode === 0
						? color.green(S_STEP_SUBMIT)
						: this.exitCode === 1
							? color.red(S_STEP_CANCEL)
							: color.red(S_STEP_ERROR);
				if (indicator === 'timer') {
					return `${step}  ${this.message} ${this.getFormattedTimer()}\n`;
				} else {
					return `${step}  ${this.message}\n`;
				}
			}
			const frame = styleFn(frames[this.frameIndex]);
			const message = this.message;
			let outputMessage: string;
			if (isCI) {
				outputMessage = `${frame}  ${message}...`;
			} else if (indicator === 'timer') {
				outputMessage = `${frame}  ${message} ${this.getFormattedTimer()}`;
			} else {
				const loadingDots = '.'.repeat(Math.floor(this.indicatorTimer)).slice(0, 3);
				outputMessage = `${frame}  ${message}${loadingDots}`;
			}
			return `${color.gray(S_BAR)}\n${outputMessage}`;
		},
	});

	prompt.prompt();

	return {
		start: (msg?: string) => prompt.start(msg),
		stop: (msg?: string) => prompt.stop(msg, 0),
		message: (msg?: string) => {
			if (msg !== undefined) {
				prompt.message = msg;
			}
		},
		cancel: (msg: string = '') => prompt.stop(msg, 1),
		error: (msg: string = '') => prompt.stop(msg, 2),
		clear: () => prompt.stop('', 0, true),
		get isCancelled() {
			return prompt.isCancelled;
		},
	};
};
