import { styleText } from 'node:util';
import { getColumns, getRows } from '@clack/core';
import { wrapAnsi } from 'fast-wrap-ansi';
import type { CommonOptions } from './common.js';

/**
 * Options for the {@link limitOptions} function.
 */
export interface LimitOptionsParams<TOption> extends CommonOptions {
	/**
	 * The list of options to display.
	 */
	options: TOption[];

	/**
	 * The index of the currently active/selected option.
	 */
	cursor: number;

	/**
	 * A function that styles the given option string.
	 *
	 * @param option - The option string to style.
	 * @param active - Whether the option is currently selected.
	 */
	style: (option: TOption, active: boolean) => string;

	/**
	 * Maximum number of options to display at once.
	 * @default Infinity
	 */
	maxItems?: number;

	/**
	 * Number of columns to reserve for padding.
	 * @default 0
	 */
	columnPadding?: number;

	/**
	 * Number of rows to reserve for padding.
	 * @default 4
	 */
	rowPadding?: number;
}

const trimLines = (
	groups: Array<string[]>,
	initialLineCount: number,
	startIndex: number,
	endIndex: number,
	maxLines: number,
	fromEnd = false
) => {
	let lineCount = initialLineCount;
	let removals = 0;
	if (fromEnd) {
		for (let i = endIndex - 1; i >= startIndex; i--) {
			lineCount -= groups[i].length;
			removals++;
			if (lineCount <= maxLines) break;
		}
	} else {
		for (let i = startIndex; i < endIndex; i++) {
			lineCount -= groups[i].length;
			removals++;
			if (lineCount <= maxLines) break;
		}
	}
	return { lineCount, removals };
};

/**
 * Trims an option list to what fits the terminal, while keeping the active
 * option (cursor) visible using a Clack style sliding window.
 *
 * @returns The lines to render.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#limitoptions
 *
 * @example
 * ```ts
 * import { limitOptions } from '@clack/prompts';
 * import { styleText } from 'node:util';
 *
 * const options = ['apple', 'banana', 'cherry', 'date'];
 * const lines = limitOptions({
 *   options,
 *   cursor: 2,
 *   maxItems: 8,
 *   style: (opt, active) =>
 *     active ? styleText('cyan', opt) : styleText('dim', opt),
 * });
 * ```
 */
export const limitOptions = <TOption>({
	cursor,
	options,
	style,
	output = process.stdout,
	maxItems = Number.POSITIVE_INFINITY,
	columnPadding = 0,
	rowPadding = 4,
}: LimitOptionsParams<TOption>): string[] => {
	const columns = getColumns(output);
	const maxWidth = columns - columnPadding;
	const rows = getRows(output);
	const overflowFormat = styleText('dim', '...');

	const outputMaxItems = Math.max(rows - rowPadding, 0);
	// We clamp to minimum 5 because anything less doesn't make sense UX wise
	const computedMaxItems = Math.max(Math.min(maxItems, outputMaxItems), 5);
	let slidingWindowLocation = 0;

	if (cursor >= computedMaxItems - 3) {
		slidingWindowLocation = Math.max(
			Math.min(cursor - computedMaxItems + 3, options.length - computedMaxItems),
			0
		);
	}

	let shouldRenderTopEllipsis = computedMaxItems < options.length && slidingWindowLocation > 0;
	let shouldRenderBottomEllipsis =
		computedMaxItems < options.length && slidingWindowLocation + computedMaxItems < options.length;

	const slidingWindowLocationEnd = Math.min(
		slidingWindowLocation + computedMaxItems,
		options.length
	);
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
		let adjustedMax = outputMaxItems;
		const trimPreceding = () =>
			trimLines(lineGroups, newLineCount, 0, cursorGroupIndex, adjustedMax);
		const trimFollowing = () =>
			trimLines(
				lineGroups,
				newLineCount,
				cursorGroupIndex + 1,
				lineGroups.length,
				adjustedMax,
				true
			);

		if (shouldRenderTopEllipsis) {
			({ lineCount: newLineCount, removals: precedingRemovals } = trimPreceding());
			if (newLineCount > adjustedMax) {
				if (!shouldRenderBottomEllipsis) adjustedMax -= 1;
				({ lineCount: newLineCount, removals: followingRemovals } = trimFollowing());
			}
		} else {
			if (!shouldRenderBottomEllipsis) adjustedMax -= 1;
			({ lineCount: newLineCount, removals: followingRemovals } = trimFollowing());
			if (newLineCount > adjustedMax) {
				adjustedMax -= 1;
				({ lineCount: newLineCount, removals: precedingRemovals } = trimPreceding());
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
