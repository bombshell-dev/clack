import process from 'node:process';
import type { Writable } from 'node:stream';
import { stripVTControlCharacters as strip } from 'node:util';
import { wrapAnsi, type Options as WrapAnsiOptions } from 'fast-wrap-ansi';
import color from 'picocolors';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_H,
	S_CONNECT_LEFT,
	S_CORNER_BOTTOM_RIGHT,
	S_CORNER_TOP_RIGHT,
	S_STEP_SUBMIT,
} from './common.js';

export interface NoteOptions extends CommonOptions {
	format?: (line: string) => string;
}

const defaultNoteFormatter = (line: string): string => color.dim(line);

const wrapWithFormat = (message: string, width: number, format: NoteOptions['format']): string => {
	const opts: WrapAnsiOptions = {
		hard: true,
		trim: false,
	};
	const wrapMsg = wrapAnsi(message, width, opts).split('\n');
	const maxWidthNormal = wrapMsg.reduce((sum, ln) => Math.max(strip(ln).length, sum), 0);
	const maxWidthFormat = wrapMsg
		.map(format)
		.reduce((sum, ln) => Math.max(strip(ln).length, sum), 0);
	const wrapWidth = width - (maxWidthFormat - maxWidthNormal);
	return wrapAnsi(message, wrapWidth, opts);
};

export const note = (message = '', title = '', opts?: NoteOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const format = (ln) => opts?.format?.(ln) ?? defaultNoteFormatter(ln);
	const wrapMsg = wrapWithFormat(message, output.columns - 6, format);
	const lines = ['', ...wrapMsg.split('\n').map(format), ''];
	const titleLen = strip(title).length;
	const len =
		Math.max(
			lines.reduce((sum, ln) => {
				const line = strip(ln);
				return line.length > sum ? line.length : sum;
			}, 0),
			titleLen
		) + 2;
	const msg = lines
		.map(
			(ln) => `${color.gray(S_BAR)}  ${ln}${' '.repeat(len - strip(ln).length)}${color.gray(S_BAR)}`
		)
		.join('\n');
	output.write(
		`${color.gray(S_BAR)}\n${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
			S_BAR_H.repeat(Math.max(len - titleLen - 1, 1)) + S_CORNER_TOP_RIGHT
		)}\n${msg}\n${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(len + 2) + S_CORNER_BOTTOM_RIGHT)}\n`
	);
};
