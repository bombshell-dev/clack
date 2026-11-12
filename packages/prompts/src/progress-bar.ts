import { styleText } from 'node:util';
import type { State } from '@clack/core';
import { isPlainLiveOutput, unicodeOr } from './common.js';
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
	output = process.stdout,
	...spinnerOptions
}: ProgressOptions = {}): ProgressResult {
	const plain = isPlainLiveOutput(output);
	const spin = spinner({ ...spinnerOptions, output });
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
		if (plain) {
			spin.start(msg);
		} else {
			spin.start(drawProgress('initial', msg));
		}
	};
	const advance = (step = 1, msg?: string): void => {
		value = Math.min(max, step + value);
		const nextMessage = msg ?? previousMessage;
		if (plain) {
			// Only emit when the human-readable message changes — bar ticks stay silent in CI.
			if (msg !== undefined) {
				spin.message(msg);
			}
		} else {
			spin.message(drawProgress('active', nextMessage));
		}
		previousMessage = nextMessage;
	};
	return {
		start,
		stop: spin.stop,
		cancel: spin.cancel,
		error: spin.error,
		clear: spin.clear,
		advance,
		get isCancelled() {
			return spin.isCancelled;
		},
		message: (msg: string) => advance(0, msg),
	};
}
