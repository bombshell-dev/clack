import type { Writable } from 'node:stream';
import { getColumns, getRows } from '@clack/core';
import { wrapAnsi } from 'fast-wrap-ansi';
import color from 'picocolors';
import type { CommonOptions } from './common.js';

export interface LimitOptionsParams<TOption> extends CommonOptions {
	options: TOption[];
	maxItems: number | undefined;
	cursor: number;
	style: (option: TOption, active: boolean) => string;
	columnPadding?: number;
	rowPadding?: number;
}

const trimLines = (
	groups: Array<string[]>,
	initialLineCount: number,
	startIndex: number,
	endIndex: number,
	maxLines: number
) => {
	let lineCount = initialLineCount;
	let removals = 0;
	for (let i = startIndex; i < endIndex; i++) {
		const group = groups[i];
		lineCount = lineCount - group.length;
		removals++;
		if (lineCount <= maxLines) {
			break;
		}
	}
	return { lineCount, removals };
};

export const limitOptions = <TOption>(params: LimitOptionsParams<TOption>): string[] => {
	const { cursor, options, style } = params;
	const output: Writable = params.output ?? process.stdout;
	const columns = getColumns(output);
	const columnPadding = params.columnPadding ?? 0;
	const rowPadding = params.rowPadding ?? 4;
	const maxWidth = columns - columnPadding;
	const rows = getRows(output);
	const overflowFormat = color.dim('...');

	const paramMaxItems = params.maxItems ?? Number.POSITIVE_INFINITY;
	const outputMaxItems = Math.max(rows - rowPadding, 0);
	// We clamp to minimum 5 because anything less doesn't make sense UX wise
	const maxItems = Math.max(Math.min(paramMaxItems, outputMaxItems), 5);
	let slidingWindowLocation = 0;

	if (cursor >= maxItems - 3) {
		slidingWindowLocation = Math.max(Math.min(cursor - maxItems + 3, options.length - maxItems), 0);
	}

	let shouldRenderTopEllipsis = maxItems < options.length && slidingWindowLocation > 0;
	let shouldRenderBottomEllipsis =
		maxItems < options.length && slidingWindowLocation + maxItems < options.length;

	const slidingWindowLocationEnd = Math.min(slidingWindowLocation + maxItems, options.length);
	const lineGroups: Array<string[]> = [];
	let lineCount = 0;
	if (shouldRenderTopEllipsis) {
		lineCount++;
	}
	if (shouldRenderBottomEllipsis) {
		lineCount++;
	}

	const slidingWindowLocationWithEllipsis =
		slidingWindowLocation + (shouldRenderTopEllipsis ? 1 : 0);
	const slidingWindowLocationEndWithEllipsis =
		slidingWindowLocationEnd - (shouldRenderBottomEllipsis ? 1 : 0);

	for (let i = slidingWindowLocationWithEllipsis; i < slidingWindowLocationEndWithEllipsis; i++) {
		const wrappedLines = wrapAnsi(style(options[i], i === cursor), maxWidth, {
			hard: true,
			trim: false,
		}).split('\n');
		lineGroups.push(wrappedLines);
		lineCount += wrappedLines.length;
	}

	if (lineCount > outputMaxItems) {
		let precedingRemovals = 0;
		let followingRemovals = 0;
		let newLineCount = lineCount;
		const cursorGroupIndex = cursor - slidingWindowLocationWithEllipsis;
		const trimLinesLocal = (startIndex: number, endIndex: number) =>
			trimLines(lineGroups, newLineCount, startIndex, endIndex, outputMaxItems);

		if (shouldRenderTopEllipsis) {
			({ lineCount: newLineCount, removals: precedingRemovals } = trimLinesLocal(
				0,
				cursorGroupIndex
			));
			if (newLineCount > outputMaxItems) {
				({ lineCount: newLineCount, removals: followingRemovals } = trimLinesLocal(
					cursorGroupIndex + 1,
					lineGroups.length
				));
			}
		} else {
			({ lineCount: newLineCount, removals: followingRemovals } = trimLinesLocal(
				cursorGroupIndex + 1,
				lineGroups.length
			));
			if (newLineCount > outputMaxItems) {
				({ lineCount: newLineCount, removals: precedingRemovals } = trimLinesLocal(
					0,
					cursorGroupIndex
				));
			}
		}

		if (precedingRemovals > 0) {
			shouldRenderTopEllipsis = true;
			lineGroups.splice(0, precedingRemovals);
		}
		if (followingRemovals > 0) {
			shouldRenderBottomEllipsis = true;
			lineGroups.splice(lineGroups.length - followingRemovals, followingRemovals);
		}
	}

	const result: string[] = [];
	if (shouldRenderTopEllipsis) {
		result.push(overflowFormat);
	}
	for (const lineGroup of lineGroups) {
		for (const line of lineGroup) {
			result.push(line);
		}
	}
	if (shouldRenderBottomEllipsis) {
		result.push(overflowFormat);
	}

	return result;
};
