import process from 'node:process';
import type { Writable } from 'node:stream';
import { getColumns, settings } from '@clack/core';
import stringWidth from 'fast-string-width';
import { type Options as WrapAnsiOptions, wrapAnsi } from 'fast-wrap-ansi';
import color from 'picocolors';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_H,
	S_CONNECT_LEFT,
	S_CORNER_BOTTOM_LEFT,
	S_CORNER_BOTTOM_RIGHT,
	S_CORNER_TOP_RIGHT,
	S_STEP_SUBMIT,
} from './common.js';

type FormatFn = (line: string) => string;
export interface NoteOptions extends CommonOptions {
	format?: FormatFn;
}

const defaultNoteFormatter = (line: string): string => color.dim(line);

const wrapWithFormat = (message: string, width: number, format: FormatFn): string => {
	const opts: WrapAnsiOptions = {
		hard: true,
		trim: false,
	};
	const wrapMsg = wrapAnsi(message, width, opts).split('\n');
	const maxWidthNormal = wrapMsg.reduce((sum, ln) => Math.max(stringWidth(ln), sum), 0);
	const maxWidthFormat = wrapMsg.map(format).reduce((sum, ln) => Math.max(stringWidth(ln), sum), 0);
	const wrapWidth = width - (maxWidthFormat - maxWidthNormal);
	return wrapAnsi(message, wrapWidth, opts);
};

export const note = (message = '', title = '', opts?: NoteOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const hasGuide = opts?.withGuide ?? settings.withGuide;
	const format = opts?.format ?? defaultNoteFormatter;
	const wrapMsg = wrapWithFormat(message, getColumns(output) - 6, format);
	const lines = ['', ...wrapMsg.split('\n').map(format), ''];
	const titleLen = stringWidth(title);
	const len =
		Math.max(
			lines.reduce((sum, ln) => {
				const width = stringWidth(ln);
				return width > sum ? width : sum;
			}, 0),
			titleLen
		) + 2;
	const msg = lines
		.map(
			(ln) => `${color.gray(S_BAR)}  ${ln}${' '.repeat(len - stringWidth(ln))}${color.gray(S_BAR)}`
		)
		.join('\n');
	const leadingBorder = hasGuide ? `${color.gray(S_BAR)}\n` : '';
	const bottomLeft = hasGuide ? S_CONNECT_LEFT : S_CORNER_BOTTOM_LEFT;
	output.write(
		`${leadingBorder}${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
			S_BAR_H.repeat(Math.max(len - titleLen - 1, 1)) + S_CORNER_TOP_RIGHT
		)}\n${msg}\n${color.gray(bottomLeft + S_BAR_H.repeat(len + 2) + S_CORNER_BOTTOM_RIGHT)}\n`
	);
};
