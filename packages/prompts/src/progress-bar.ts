import { styleText } from 'node:util';
import type { State } from '@clack/core';
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
		return spin.start(drawProgress('initial', msg));
	};
	const advance = (step = 1, msg?: string): void => {
		value = Math.min(max, step + value);
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
