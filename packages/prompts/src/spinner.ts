import { block, settings } from '@clack/core';
import color from 'picocolors';
import { cursor, erase } from 'sisteransi';
import {
	type CommonOptions,
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
}

export interface SpinnerResult {
	start(msg?: string): void;
	stop(msg?: string, code?: number): void;
	message(msg?: string): void;
	readonly isCancelled: boolean;
}

export const spinner = ({
	indicator = 'dots',
	onCancel,
	output = process.stdout,
	cancelMessage,
	errorMessage,
}: SpinnerOptions = {}): SpinnerResult => {
	const frames = unicode ? ['◒', '◐', '◓', '◑'] : ['•', 'o', 'O', '0'];
	const delay = unicode ? 80 : 120;
	const isCI = process.env.CI === 'true';

	let unblock: () => void;
	let loop: NodeJS.Timeout;
	let isSpinnerActive = false;
	let isCancelled = false;
	let _message = '';
	let _prevMessage: string | undefined = undefined;
	let _origin: number = performance.now();

	const handleExit = (code: number) => {
		const msg =
			code > 1
				? (errorMessage ?? settings.messages.error)
				: (cancelMessage ?? settings.messages.cancel);
		isCancelled = code === 1;
		if (isSpinnerActive) {
			stop(msg, code);
			if (isCancelled && typeof onCancel === 'function') {
				onCancel();
			}
		}
	};

	const errorEventHandler = () => handleExit(2);
	const signalEventHandler = () => handleExit(1);

	const registerHooks = () => {
		// Reference: https://nodejs.org/api/process.html#event-uncaughtexception
		process.on('uncaughtExceptionMonitor', errorEventHandler);
		// Reference: https://nodejs.org/api/process.html#event-unhandledrejection
		process.on('unhandledRejection', errorEventHandler);
		// Reference Signal Events: https://nodejs.org/api/process.html#signal-events
		process.on('SIGINT', signalEventHandler);
		process.on('SIGTERM', signalEventHandler);
		process.on('exit', handleExit);
	};

	const clearHooks = () => {
		process.removeListener('uncaughtExceptionMonitor', errorEventHandler);
		process.removeListener('unhandledRejection', errorEventHandler);
		process.removeListener('SIGINT', signalEventHandler);
		process.removeListener('SIGTERM', signalEventHandler);
		process.removeListener('exit', handleExit);
	};

	const clearPrevMessage = () => {
		if (_prevMessage === undefined) return;
		if (isCI) output.write('\n');
		const prevLines = _prevMessage.split('\n');
		output.write(cursor.move(-999, prevLines.length - 1));
		output.write(erase.down(prevLines.length));
	};

	const removeTrailingDots = (msg: string): string => {
		return msg.replace(/\.+$/, '');
	};

	const formatTimer = (origin: number): string => {
		const duration = (performance.now() - origin) / 1000;
		const min = Math.floor(duration / 60);
		const secs = Math.floor(duration % 60);
		return min > 0 ? `[${min}m ${secs}s]` : `[${secs}s]`;
	};

	const start = (msg = ''): void => {
		isSpinnerActive = true;
		unblock = block({ output });
		_message = removeTrailingDots(msg);
		_origin = performance.now();
		output.write(`${color.gray(S_BAR)}\n`);
		let frameIndex = 0;
		let indicatorTimer = 0;
		registerHooks();
		loop = setInterval(() => {
			if (isCI && _message === _prevMessage) {
				return;
			}
			clearPrevMessage();
			_prevMessage = _message;
			const frame = color.magenta(frames[frameIndex]);

			if (isCI) {
				output.write(`${frame}  ${_message}...`);
			} else if (indicator === 'timer') {
				output.write(`${frame}  ${_message} ${formatTimer(_origin)}`);
			} else {
				const loadingDots = '.'.repeat(Math.floor(indicatorTimer)).slice(0, 3);
				output.write(`${frame}  ${_message}${loadingDots}`);
			}

			frameIndex = frameIndex + 1 < frames.length ? frameIndex + 1 : 0;
			indicatorTimer = indicatorTimer < frames.length ? indicatorTimer + 0.125 : 0;
		}, delay);
	};

	const stop = (msg = '', code = 0): void => {
		isSpinnerActive = false;
		clearInterval(loop);
		clearPrevMessage();
		const step =
			code === 0
				? color.green(S_STEP_SUBMIT)
				: code === 1
					? color.red(S_STEP_CANCEL)
					: color.red(S_STEP_ERROR);
		_message = msg ?? _message;
		if (indicator === 'timer') {
			output.write(`${step}  ${_message} ${formatTimer(_origin)}\n`);
		} else {
			output.write(`${step}  ${_message}\n`);
		}
		clearHooks();
		unblock();
	};

	const message = (msg = ''): void => {
		_message = removeTrailingDots(msg ?? _message);
	};

	return {
		start,
		stop,
		message,
		get isCancelled() {
			return isCancelled;
		},
	};
};
