import type { Writable } from 'node:stream';
import { styleText } from 'node:util';
import { settings } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, S_BAR_START } from './common.js';

export const cancel = (message = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const hasGuide = opts?.withGuide ?? settings.withGuide;
	const prefix = hasGuide ? `${styleText('gray', S_BAR_END)}  ` : '';
	output.write(`${prefix}${styleText('red', message)}\n\n`);
};

export const intro = (title = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const hasGuide = opts?.withGuide ?? settings.withGuide;
	const prefix = hasGuide ? `${styleText('gray', S_BAR_START)}  ` : '';
	output.write(`${prefix}${title}\n`);
};

export const outro = (message = '', opts?: CommonOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const hasGuide = opts?.withGuide ?? settings.withGuide;
	const prefix = hasGuide ? `${styleText('gray', S_BAR)}\n${styleText('gray', S_BAR_END)}  ` : '';
	output.write(`${prefix}${message}\n\n`);
};
