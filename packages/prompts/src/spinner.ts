import { styleText } from 'node:util';
import { block, getColumns, settings } from '@clack/core';
import { wrapAnsi } from 'fast-wrap-ansi';
import { cursor, erase } from 'sisteransi';
import {
	type CommonOptions,
	isCI as isCIFn,
	S_BAR,
	S_STEP_CANCEL,
	S_STEP_ERROR,
	S_STEP_SUBMIT,
	unicode,
} from './common.js';

/**
 * Options for the {@link spinner} component
 */
export interface SpinnerOptions extends CommonOptions {
	/**
	 * The type of indicator to display. `'dots'` shows an animated loading
	 * dot sequence, `'timer'` shows elapsed time.
	 *
	 * @default 'dots'
	 */
	indicator?: 'dots' | 'timer';

	/**
	 * Callback invoked when the spinner is cancelled (e.g. user presses Ctrl+C).
	 */
	onCancel?: () => void;

	/**
	 * Message displayed when the spinner is cancelled.
	 */
	cancelMessage?: string;

	/**
	 * Message displayed when the spinner encounters an error.
	 */
	errorMessage?: string;

	/**
	 * Custom animation frames for the spinner indicator.
	 * @default ['◒', '◐', '◓', '◑'] (unicode) or ['•', 'o', 'O', '0'] (non-unicode)
	 */
	frames?: string[];

	/**
	 * Delay between frame updates in milliseconds.
	 * @default 80 (unicode) or 120 (non-unicode)
	 */
	delay?: number;

	/**
	 * Custom function to style each spinner frame.
	 */
	styleFrame?: (frame: string) => string;
}

/**
 * The result object returned by the {@link spinner} function.
 */
export interface SpinnerResult {
	/**
	 * Start the spinner with an optional message.
	 */
	start(msg?: string): void;

	/**
	 * Stop the spinner and display a success message with a green checkmark.
	 */
	stop(msg?: string): void;

	/**
	 * Stop the spinner and display a cancellation message with a red square.
	 */
	cancel(msg?: string): void;

	/**
	 * Stop the spinner and display an error message with a yellow triangle.
	 */
	error(msg?: string): void;

	/**
	 * Update the spinner message while it is running.
	 */
	message(msg?: string): void;

	/**
	 * Clear the spinner without displaying any message.
	 */
	clear(): void;

	/**
	 * Whether the spinner was cancelled (e.g. user pressed Ctrl+C).
	 */
	readonly isCancelled: boolean;
}

const defaultStyleFn: SpinnerOptions['styleFrame'] = (frame) => styleText('magenta', frame);

/**
 * The `spinner` component displays an animated loading indicator for
 * long-running operations.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#spinner
 *
 * @example
 * ```ts
 * import { spinner } from '@clack/prompts';
 *
 * const s = spinner();
 * s.start('Loading data');
 * // ... do work ...
 * s.stop('Data loaded');
 * ```
 */
export const spinner = ({
	indicator = 'dots',
	onCancel,
	output = process.stdout,
	cancelMessage,
	errorMessage,
	frames = unicode ? ['◒', '◐', '◓', '◑'] : ['•', 'o', 'O', '0'],
	delay = unicode ? 80 : 120,
	signal,
	...opts
}: SpinnerOptions = {}): SpinnerResult => {
	const isCI = isCIFn();

	let unblock: () => void;
	let loop: NodeJS.Timeout;
	let isSpinnerActive = false;
	let isCancelled = false;
	let _message = '';
	let _prevMessage: string | undefined;
	let _origin: number = performance.now();
	const columns = getColumns(output);
	const styleFn = opts?.styleFrame ?? defaultStyleFn;

	const handleExit = (code: number) => {
		const msg =
			code > 1
				? (errorMessage ?? settings.messages.error)
				: (cancelMessage ?? settings.messages.cancel);
		isCancelled = code === 1;
		if (isSpinnerActive) {
			_stop(msg, code);
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

		if (signal) {
			signal.addEventListener('abort', signalEventHandler);
		}
	};

	const clearHooks = () => {
		process.removeListener('uncaughtExceptionMonitor', errorEventHandler);
		process.removeListener('unhandledRejection', errorEventHandler);
		process.removeListener('SIGINT', signalEventHandler);
		process.removeListener('SIGTERM', signalEventHandler);
		process.removeListener('exit', handleExit);

		if (signal) {
			signal.removeEventListener('abort', signalEventHandler);
		}
	};

	const clearPrevMessage = () => {
		if (_prevMessage === undefined) return;
		if (isCI) output.write('\n');
		const wrapped = wrapAnsi(_prevMessage, columns, {
			hard: true,
			trim: false,
		});
		const prevLines = wrapped.split('\n');
		if (prevLines.length > 1) {
			output.write(cursor.up(prevLines.length - 1));
		}
		output.write(cursor.to(0));
		output.write(erase.down());
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

	const hasGuide = opts.withGuide ?? settings.withGuide;

	const start = (msg = ''): void => {
		isSpinnerActive = true;
		unblock = block({ output });
		_message = removeTrailingDots(msg);
		_origin = performance.now();
		if (hasGuide) {
			output.write(`${styleText('gray', S_BAR)}\n`);
		}
		let frameIndex = 0;
		let indicatorTimer = 0;
		registerHooks();
		loop = setInterval(() => {
			if (isCI && _message === _prevMessage) {
				return;
			}
			clearPrevMessage();
			_prevMessage = _message;
			const frame = styleFn(frames[frameIndex]);
			let outputMessage: string;

			if (isCI) {
				outputMessage = `${frame}  ${_message}...`;
			} else if (indicator === 'timer') {
				outputMessage = `${frame}  ${_message} ${formatTimer(_origin)}`;
			} else {
				const loadingDots = '.'.repeat(Math.floor(indicatorTimer)).slice(0, 3);
				outputMessage = `${frame}  ${_message}${loadingDots}`;
			}

			const wrapped = wrapAnsi(outputMessage, columns, {
				hard: true,
				trim: false,
			});
			output.write(wrapped);

			frameIndex = frameIndex + 1 < frames.length ? frameIndex + 1 : 0;
			// indicator increase by 1 every 8 frames
			indicatorTimer = indicatorTimer < 4 ? indicatorTimer + 0.125 : 0;
		}, delay);
	};

	const _stop = (msg = '', code = 0, silent: boolean = false): void => {
		if (!isSpinnerActive) return;
		isSpinnerActive = false;
		clearInterval(loop);
		clearPrevMessage();
		const step =
			code === 0
				? styleText('green', S_STEP_SUBMIT)
				: code === 1
					? styleText('red', S_STEP_CANCEL)
					: styleText('red', S_STEP_ERROR);
		_message = msg ?? _message;
		if (!silent) {
			if (indicator === 'timer') {
				output.write(`${step}  ${_message} ${formatTimer(_origin)}\n`);
			} else {
				output.write(`${step}  ${_message}\n`);
			}
		}
		clearHooks();
		unblock();
	};

	const stop = (msg = ''): void => _stop(msg, 0);
	const cancel = (msg = ''): void => _stop(msg, 1);
	const error = (msg = ''): void => _stop(msg, 2);
	// TODO (43081j): this will leave the initial S_BAR since we purposely
	// don't erase that in `clearPrevMessage`. In future, we may want to treat
	// `clear` as a special case and remove the bar too.
	const clear = (): void => _stop('', 0, true);

	const message = (msg = ''): void => {
		_message = removeTrailingDots(msg ?? _message);
	};

	return {
		start,
		stop,
		message,
		cancel,
		error,
		clear,
		get isCancelled() {
			return isCancelled;
		},
	};
};
