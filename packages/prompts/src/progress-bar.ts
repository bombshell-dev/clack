import { styleText } from 'node:util';
import type { State } from '@clack/core';
import { unicodeOr } from './common.js';
import { type SpinnerOptions, type SpinnerResult, spinner } from './spinner.js';

const S_PROGRESS_CHAR: Record<NonNullable<ProgressOptions['style']>, string> = {
	light: unicodeOr('─', '-'),
	heavy: unicodeOr('━', '='),
	block: unicodeOr('█', '#'),
};

/**
 * Options for the {@link progress} component.
 */
export interface ProgressOptions extends SpinnerOptions {
	/**
	 * Visual style of the progress bar characters.
	 * @default 'heavy'
	 */
	style?: 'light' | 'heavy' | 'block';

	/**
	 * Maximum value for the progress bar (total steps).
	 * @default 100
	 */
	max?: number;

	/**
	 * Display width of the progress bar in characters.
	 * @default 40
	 */
	size?: number;
}

/**
 * Result object returned by the {@link progress} component.
 */
export interface ProgressResult extends SpinnerResult {
	/**
	 * Advance the progress bar by a number of steps.
	 * @param step - Number of steps to advance (default: 1)
	 * @param msg - Optional message to display alongside the progress bar
	 */
	advance(step?: number, msg?: string): void;
}

/**
 * The `progress` component displays an animated progress bar.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#progress
 *
 * @example
 * ```ts
 * import { progress } from '@clack/prompts';
 *
 * const p = progress();
 * p.start('Uploading files');
 * p.advance(25);
 * p.advance(25);
 * p.advance(50);
 * p.stop('Upload complete');
 * ```
 */
export function progress({
	style = 'heavy',
	max: userMax = 100,
	size: userSize = 40,
	...spinnerOptions
}: ProgressOptions = {}): ProgressResult {
	const spin = spinner(spinnerOptions);
	let value = 0;
	let previousMessage = '';

	const max = Math.max(1, userMax);
	const size = Math.max(1, userSize);

	const activeStyle = (state: State) => {
		switch (state) {
			case 'initial':
			case 'active':
				return (text: string) => styleText('magenta', text);
			case 'error':
			case 'cancel':
				return (text: string) => styleText('red', text);
			case 'submit':
				return (text: string) => styleText('green', text);
			default:
				return (text: string) => styleText('magenta', text);
		}
	};
	const drawProgress = (state: State, msg: string) => {
		const active = Math.floor((value / max) * size);
		return `${activeStyle(state)(S_PROGRESS_CHAR[style].repeat(active))}${styleText('dim', S_PROGRESS_CHAR[style].repeat(size - active))} ${msg}`;
	};

	const start = (msg = '') => {
		previousMessage = msg;
		spin.start(drawProgress('initial', msg));
	};
	const advance = (step = 1, msg?: string): void => {
		value = Math.min(max, step + value);
		spin.message(drawProgress('active', msg ?? previousMessage));
		previousMessage = msg ?? previousMessage;
	};
	return {
		start,
		stop: spin.stop,
		cancel: spin.cancel,
		error: spin.error,
		clear: spin.clear,
		advance,
		isCancelled: spin.isCancelled,
		message: (msg: string) => advance(0, msg),
	};
}
