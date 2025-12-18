import type { State } from '@clack/core';
import color from 'picocolors';
import { unicodeOr } from './common.js';
import { type SpinnerOptions, type SpinnerResult, spinner } from './spinner.js';

const S_PROGRESS_CHAR: Record<NonNullable<ProgressOptions['style']>, string> = {
	light: unicodeOr('─', '-'),
	heavy: unicodeOr('━', '='),
	block: unicodeOr('█', '#'),
};

export interface ProgressOptions extends SpinnerOptions {
	style?: 'light' | 'heavy' | 'block';
	max?: number;
	size?: number;
}

export interface ProgressResult extends SpinnerResult {
	advance(step?: number, msg?: string): void;
}

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
				return color.magenta;
			case 'error':
			case 'cancel':
				return color.red;
			case 'submit':
				return color.green;
			default:
				return color.magenta;
		}
	};
	const drawProgress = (state: State, msg: string) => {
		const active = Math.floor((value / max) * size);
		return `${activeStyle(state)(S_PROGRESS_CHAR[style].repeat(active))}${color.dim(S_PROGRESS_CHAR[style].repeat(size - active))} ${msg}`;
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
