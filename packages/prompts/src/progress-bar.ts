import { styleText } from 'node:util';
import { isAccessible, type State } from '@clack/core';
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
	output = process.stdout,
	...spinnerOptions
}: ProgressOptions = {}): ProgressResult {
	const accessible = isAccessible(spinnerOptions.accessible);
	const spin = spinner({ ...spinnerOptions, output });
	let value = 0;
	let previousMessage = '';
	let running = false;
	let announced = 0;

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

	const label = accessible ? (_state: State, msg: string) => msg : drawProgress;

	const announce = () => {
		if (!accessible || !running || spin.isCancelled) return;
		const reached = Math.floor((value * 4) / max) * 25;
		if (reached <= announced) return;
		announced = reached;
		const msg = previousMessage.replace(/\.+$/, '');
		output.write(msg === '' ? `${reached}%\n` : `${reached}%: ${msg}\n`);
	};

	const finish = (end: (msg?: string) => void) => (msg?: string) => {
		running = false;
		end(msg);
	};

	const start = (msg = '') => {
		previousMessage = msg;
		running = true;
		spin.start(label('initial', msg));
	};
	const advance = (step = 1, msg?: string): void => {
		value = Math.min(max, step + value);
		spin.message(label('active', msg ?? previousMessage));
		previousMessage = msg ?? previousMessage;
		announce();
	};
	return {
		start,
		stop: finish(spin.stop),
		cancel: finish(spin.cancel),
		error: finish(spin.error),
		clear: finish(spin.clear),
		advance,
		get isCancelled() {
			return spin.isCancelled;
		},
		message: (msg: string) => advance(0, msg),
	};
}
