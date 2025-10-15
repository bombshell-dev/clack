import type { Writable } from 'node:stream';
import { styleText } from 'node:util';
import { type CommonOptions, S_BAR, S_BAR_END, S_BAR_START } from './common.js';

export const cancel = (message = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	output.write(`${styleText('gray', S_BAR_END)}  ${styleText('red', message)}\n\n`);
};

export const intro = (title = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	output.write(`${styleText('gray', S_BAR_START)}  ${title}\n`);
};

export const outro = (message = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	output.write(`${styleText('gray', S_BAR)}\n${styleText('gray', S_BAR_END)}  ${message}\n\n`);
};
