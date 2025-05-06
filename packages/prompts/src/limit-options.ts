import type { Writable } from 'node:stream';
import { WriteStream } from 'node:tty';
import color from 'picocolors';
import type { CommonOptions } from './common.js';

export interface LimitOptionsParams<TOption> extends CommonOptions {
	options: TOption[];
	maxItems: number | undefined;
	cursor: number;
	style: (option: TOption, active: boolean) => string;
}

export const limitOptions = <TOption>(params: LimitOptionsParams<TOption>): string[] => {
	const { cursor, options, style } = params;
	const output: Writable = params.output ?? process.stdout;
	const rows = output instanceof WriteStream && output.rows !== undefined ? output.rows : 10;
	const overflowFormat = color.dim('...');

	const paramMaxItems = params.maxItems ?? Number.POSITIVE_INFINITY;
	const outputMaxItems = Math.max(rows - 4, 0);
	// We clamp to minimum 5 because anything less doesn't make sense UX wise
	const maxItems = Math.min(outputMaxItems, Math.max(paramMaxItems, 5));
	let slidingWindowLocation = 0;

	if (cursor >= slidingWindowLocation + maxItems - 3) {
		slidingWindowLocation = Math.max(Math.min(cursor - maxItems + 3, options.length - maxItems), 0);
	} else if (cursor < slidingWindowLocation + 2) {
		slidingWindowLocation = Math.max(cursor - 2, 0);
	}

	const shouldRenderTopEllipsis = maxItems < options.length && slidingWindowLocation > 0;
	const shouldRenderBottomEllipsis =
		maxItems < options.length && slidingWindowLocation + maxItems < options.length;

	return options
		.slice(slidingWindowLocation, slidingWindowLocation + maxItems)
		.map((option, i, arr) => {
			const isTopLimit = i === 0 && shouldRenderTopEllipsis;
			const isBottomLimit = i === arr.length - 1 && shouldRenderBottomEllipsis;
			return isTopLimit || isBottomLimit
				? overflowFormat
				: style(option, i + slidingWindowLocation === cursor);
		});
};
