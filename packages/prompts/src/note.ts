import type { Writable } from 'node:stream';
import { stripVTControlCharacters as strip } from 'node:util';
import { styleText } from 'node:util';
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

// const defaultNoteFormatter = (line: string): string => color.dim(line);
const defaultNoteFormatter = (line: string): string => styleText('dim', line);

export const note = (message = '', title = '', opts?: NoteOptions) => {
	const format = opts?.format ?? defaultNoteFormatter;
	const lines = ['', ...message.split('\n').map(format), ''];
	const titleLen = strip(title).length;
	const output: Writable = opts?.output ?? process.stdout;
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
			(ln) =>
				`${styleText('gray', S_BAR)}  ${ln}${' '.repeat(len - strip(ln).length)}${styleText('gray', S_BAR)}`
		)
		.join('\n');
	output.write(
		`${styleText('gray', S_BAR)}\n${styleText('green', S_STEP_SUBMIT)}  ${styleText('reset', title)} ${styleText(
			'gray',
			S_BAR_H.repeat(Math.max(len - titleLen - 1, 1)) + S_CORNER_TOP_RIGHT
		)})\n${msg}\n${styleText('gray', S_CONNECT_LEFT + S_BAR_H.repeat(len + 2) + S_CORNER_BOTTOM_RIGHT)}\n`
	);
};
