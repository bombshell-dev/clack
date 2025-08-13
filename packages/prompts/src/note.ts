import type { Writable } from 'node:stream';
import { stripVTControlCharacters as strip } from 'node:util';
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
import { wrapAnsi } from "fast-wrap-ansi";
import process from "node:process";

export interface NoteOptions extends CommonOptions {
	format?: (line: string) => string;
}

const defaultNoteFormatter = (line: string): string => color.dim(line);

const wrapWithFormat = (message: string, width: number, format: NoteOptions["format"]): string => {
  const wrapMsg = wrapAnsi(message, width).split("\n");
  const maxWidthNormal = wrapMsg.reduce((sum, ln) => Math.max(strip(ln).length, sum), 0);
  const maxWidthFormat = wrapMsg.map(format).reduce((sum, ln) => Math.max(strip(ln).length, sum), 0);
  const wrapWidth = maxWidthNormal - (maxWidthFormat - maxWidthNormal);
  return wrapAnsi(message, wrapWidth);
}

export const note = (message = '', title = '', opts?: NoteOptions) => {
  const output: Writable = opts?.output ?? process.stdout;
  const format = opts?.format ?? defaultNoteFormatter;
  const wrapMsg = wrapWithFormat(message, output.columns - 6, format);
  const lines = ['', ...wrapMsg.split('\n').map(format), ''];
  const titleLen = strip(title).length;
  const len = Math.max(
    lines.reduce((sum, ln) => Math.max(strip(ln).length, sum), 0),
    titleLen
  );
  const header = `${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(S_BAR_H.repeat(len - titleLen + 1) + S_CORNER_TOP_RIGHT)}`;
  const noteLines = lines.map(
    (line) =>
      `${color.gray(S_BAR)}  ${line}${' '.repeat(len - strip(line).length + 2)}${color.gray(S_BAR)}`
  );
  const footer = `${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(len + 4) + S_CORNER_BOTTOM_RIGHT)}`;
  output.write(`${color.gray(S_BAR)}\n${header}\n${noteLines.join('\n')}\n${footer}\n`);
};
