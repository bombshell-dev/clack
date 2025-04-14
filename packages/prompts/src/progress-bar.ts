import type { State } from '@clack/core';
import color from 'picocolors';
import { S_PROGRESS_CHAR, type SpinnerOptions, type SpinnerResult, spinner } from './index.js';

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
	max = 100,
	size = 40,
	...spinnerOptions
}: ProgressOptions = {}): ProgressResult {
	const spin = spinner(spinnerOptions);
	let value = 0;
	let previousMessage = '';

	const _max = Math.max(1, max);
	const _size = Math.max(1, size);

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
		const active = Math.floor((value / _max) * _size);
		return `${activeStyle(state)(S_PROGRESS_CHAR[style].repeat(active))}${color.dim(S_PROGRESS_CHAR[style].repeat(_size - active))} ${msg}`;
	};

	const start = (msg = '') => {
		previousMessage = msg;
		return spin.start(drawProgress('initial', msg));
	};
	const advance = (step = 1, msg?: string): void => {
		value = Math.min(_max, step + value);
		spin.message(drawProgress('active', msg ?? previousMessage));
		previousMessage = msg ?? previousMessage;
	};
	return {
		start,
		stop: spin.stop,
		advance,
		isCancelled: spin.isCancelled,
		message: (msg: string) => advance(0, msg),
	};
}
