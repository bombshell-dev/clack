import type { Writable } from 'node:stream';
import { getColumns } from '@clack/core';
import wrap from 'wrap-ansi';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_BAR_END_RIGHT,
	S_BAR_H,
	S_BAR_START,
	S_BAR_START_RIGHT,
	S_CORNER_BOTTOM_LEFT,
	S_CORNER_BOTTOM_RIGHT,
	S_CORNER_TOP_LEFT,
	S_CORNER_TOP_RIGHT,
} from './common.js';

export type BoxAlignment = 'left' | 'center' | 'right';

type BoxSymbols = [topLeft: string, topRight: string, bottomLeft: string, bottomRight: string];

const roundedSymbols: BoxSymbols = [
	S_CORNER_TOP_LEFT,
	S_CORNER_TOP_RIGHT,
	S_CORNER_BOTTOM_LEFT,
	S_CORNER_BOTTOM_RIGHT,
];
const squareSymbols: BoxSymbols = [S_BAR_START, S_BAR_START_RIGHT, S_BAR_END, S_BAR_END_RIGHT];

export interface BoxOptions extends CommonOptions {
	format?: (line: string) => string;
	contentAlign?: BoxAlignment;
	titleAlign?: BoxAlignment;
	width?: number | 'auto';
	titlePadding?: number;
	contentPadding?: number;
	rounded?: boolean;
}

function getPaddingForLine(
	lineLength: number,
	innerWidth: number,
	padding: number,
	contentAlign: BoxAlignment | undefined
): [number, number] {
	let leftPadding = padding;
	let rightPadding = padding;
	if (contentAlign === 'center') {
		leftPadding = Math.floor((innerWidth - lineLength) / 2);
	} else if (contentAlign === 'right') {
		leftPadding = innerWidth - lineLength - padding;
	}

	rightPadding = innerWidth - leftPadding - lineLength;

	return [leftPadding, rightPadding];
}

export const box = (message = '', title = '', opts?: BoxOptions) => {
	const output: Writable = opts?.output ?? process.stdout;
	const columns = getColumns(output);
	const borderWidth = 1;
	const borderTotalWidth = borderWidth * 2;
	const titlePadding = opts?.titlePadding ?? 1;
	const contentPadding = opts?.contentPadding ?? 2;
	const width = opts?.width === undefined || opts.width === 'auto' ? 1 : opts.width;
	const symbols = opts?.rounded ? roundedSymbols : squareSymbols;
	let boxWidth = Math.floor(columns * width);
	if (opts?.width === 'auto') {
		const lines = message.split('\n');
		let longestLine = 0;
		for (const line of lines) {
			if (line.length > longestLine) {
				longestLine = line.length;
			}
		}
		const longestLineWidth = longestLine + borderTotalWidth + contentPadding * 2;
		if (longestLineWidth < boxWidth) {
			boxWidth = longestLineWidth;
		}
	}
	if (boxWidth % 2 !== 0) {
		boxWidth--;
	}
	const maxTitleLength = boxWidth - borderTotalWidth - titlePadding * 2;
	const truncatedTitle =
		title.length > maxTitleLength ? `${title.slice(0, maxTitleLength - 3)}...` : title;
	const innerWidth = boxWidth - borderTotalWidth;
	const [titlePaddingLeft, titlePaddingRight] = getPaddingForLine(
		truncatedTitle.length,
		innerWidth,
		titlePadding,
		opts?.titleAlign
	);
	const wrappedMessage = wrap(message, innerWidth - contentPadding * 2, {
		hard: true,
		trim: false,
	});
	output.write(
		`${symbols[0]}${S_BAR_H.repeat(titlePaddingLeft)}${truncatedTitle}${S_BAR_H.repeat(titlePaddingRight)}${symbols[1]}\n`
	);
	const wrappedLines = wrappedMessage.split('\n');
	for (const line of wrappedLines) {
		const [leftLinePadding, rightLinePadding] = getPaddingForLine(
			line.length,
			innerWidth,
			contentPadding,
			opts?.contentAlign
		);
		output.write(
			`${S_BAR}${' '.repeat(leftLinePadding)}${line}${' '.repeat(rightLinePadding)}${S_BAR}\n`
		);
	}
	output.write(`${symbols[2]}${S_BAR_H.repeat(innerWidth)}${symbols[3]}\n`);
};
