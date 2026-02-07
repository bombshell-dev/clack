import type { DateFormatConfig, DateParts } from '@clack/core';
import { DatePrompt, settings } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

export type DateFormat = 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';

type CursorState = { segmentIndex: number; positionInSegment: number };
type RenderState = 'active' | 'submit' | 'cancel' | 'error';

const DEFAULT_SEGMENT_LABELS: Record<'year' | 'month' | 'day', string> = {
	year: 'yyyy',
	month: 'mm',
	day: 'dd',
};

/** Derive a plain formatter from segment order -- single source of truth */
function makePlainFormatter(segments: DateFormatConfig['segments']): (parts: DateParts) => string {
	return (p) => segments.map((s) => p[s.type]).join('/');
}

/** Render a single segment with cursor highlighting */
function renderSegment(
	value: string,
	segmentIndex: number,
	cursor: CursorState,
	label: string,
	state: RenderState
): string {
	const isBlank = !value || value.replace(/_/g, '') === '';
	const cursorInThis =
		segmentIndex === cursor.segmentIndex && state !== 'submit' && state !== 'cancel';
	const parts: string[] = [];

	if (isBlank) {
		if (cursorInThis) {
			for (let j = 0; j < label.length; j++) {
				parts.push(j === cursor.positionInSegment ? color.inverse(' ') : color.dim(label[j]));
			}
		} else {
			parts.push(color.dim(label));
		}
	} else {
		for (let j = 0; j < value.length; j++) {
			if (cursorInThis && j === cursor.positionInSegment) {
				parts.push(value[j] === '_' ? color.inverse(' ') : color.inverse(value[j]));
			} else {
				parts.push(value[j] === '_' ? color.dim(' ') : value[j]);
			}
		}
	}

	return parts.join('');
}

/** Generic data-driven renderer -- iterates segments from config, no per-format duplication */
function renderDateFormat(
	parts: DateParts,
	cursor: CursorState,
	state: RenderState,
	config: DateFormatConfig
): string {
	if (state === 'submit' || state === 'cancel') {
		return config.format(parts);
	}
	const labels = config.segmentLabels ?? DEFAULT_SEGMENT_LABELS;
	const sep = color.gray('/');
	const rendered = config.segments.map((seg, i) =>
		renderSegment(parts[seg.type], i, cursor, labels[seg.type], state)
	);
	let result = rendered.join(sep);
	// Add cursor block if beyond last segment
	const lastSeg = config.segments[config.segments.length - 1];
	if (
		cursor.segmentIndex >= config.segments.length ||
		(cursor.segmentIndex === config.segments.length - 1 && cursor.positionInSegment >= lastSeg.len)
	) {
		result += '█';
	}
	return result;
}

/** Segment definitions per format -- the single source of truth for order and lengths */
const SEGMENT_DEFS: Record<DateFormat, DateFormatConfig['segments']> = {
	'YYYY/MM/DD': [
		{ type: 'year', len: 4 },
		{ type: 'month', len: 2 },
		{ type: 'day', len: 2 },
	],
	'MM/DD/YYYY': [
		{ type: 'month', len: 2 },
		{ type: 'day', len: 2 },
		{ type: 'year', len: 4 },
	],
	'DD/MM/YYYY': [
		{ type: 'day', len: 2 },
		{ type: 'month', len: 2 },
		{ type: 'year', len: 4 },
	],
};

/** Pre-computed format configs derived from segment definitions */
const FORMAT_CONFIGS: Record<DateFormat, DateFormatConfig> = Object.fromEntries(
	(Object.entries(SEGMENT_DEFS) as [DateFormat, DateFormatConfig['segments']][]).map(
		([key, segments]) => [key, { segments, format: makePlainFormatter(segments) }]
	)
) as Record<DateFormat, DateFormatConfig>;

export interface DateOptions extends CommonOptions {
	message: string;
	format?: DateFormat;
	defaultValue?: Date;
	initialValue?: Date;
	minDate?: Date;
	maxDate?: Date;
	validate?: (value: Date | undefined) => string | Error | undefined;
}

export const date = (opts: DateOptions) => {
	const validate = opts.validate;
	const formatConfig = FORMAT_CONFIGS[opts.format ?? 'YYYY/MM/DD'];
	return new DatePrompt({
		formatConfig,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		minDate: opts.minDate,
		maxDate: opts.maxDate,
		validate(value: Date | undefined) {
			if (value === undefined) {
				if (opts.defaultValue !== undefined) return undefined;
				if (validate) return validate(value);
				return 'Please enter a valid date';
			}
			const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
			if (opts.minDate && dateOnly(value) < dateOnly(opts.minDate)) {
				return settings.date.messages.afterMin(opts.minDate);
			}
			if (opts.maxDate && dateOnly(value) > dateOnly(opts.maxDate)) {
				return settings.date.messages.beforeMax(opts.maxDate);
			}
			if (validate) return validate(value);
			return undefined;
		},
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render() {
			const hasGuide = (opts?.withGuide ?? settings.withGuide) !== false;
			const titlePrefix = `${hasGuide ? `${color.gray(S_BAR)}\n` : ''}${symbol(this.state)}  `;
			const title = `${titlePrefix}${opts.message}\n`;

			// Get segment values and cursor from core
			const segmentValues = this.segmentValues;
			const segmentCursor = this.segmentCursor;

			// Determine render state
			const renderState: RenderState =
				this.state === 'submit'
					? 'submit'
					: this.state === 'cancel'
						? 'cancel'
						: this.state === 'error'
							? 'error'
							: 'active';

			// Render using generic data-driven renderer
			const userInput = renderDateFormat(segmentValues, segmentCursor, renderState, formatConfig);

			const value =
				this.value instanceof Date
					? formatConfig.format({
							year: String(this.value.getFullYear()).padStart(4, '0'),
							month: String(this.value.getMonth() + 1).padStart(2, '0'),
							day: String(this.value.getDate()).padStart(2, '0'),
						})
					: '';

			switch (this.state) {
				case 'error': {
					const errorText = this.error ? `  ${color.yellow(this.error)}` : '';
					const errorPrefix = hasGuide ? `${color.yellow(S_BAR)}  ` : '';
					const errorPrefixEnd = hasGuide ? color.yellow(S_BAR_END) : '';
					return `${title.trim()}\n${errorPrefix}${userInput}\n${errorPrefixEnd}${errorText}\n`;
				}
				case 'submit': {
					const valueText = value ? `  ${color.dim(value)}` : '';
					const submitPrefix = hasGuide ? color.gray(S_BAR) : '';
					return `${title}${submitPrefix}${valueText}`;
				}
				case 'cancel': {
					const valueText = value ? `  ${color.strikethrough(color.dim(value))}` : '';
					const cancelPrefix = hasGuide ? color.gray(S_BAR) : '';
					return `${title}${cancelPrefix}${valueText}${value.trim() ? `\n${cancelPrefix}` : ''}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${color.cyan(S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? color.cyan(S_BAR_END) : '';
					// Inline validation: extra bar (│) below date, bar end (└) only at the end
					const inlineErrorBar = hasGuide ? `${color.cyan(S_BAR)}  ` : '';
					const inlineError = (this as { inlineError?: string }).inlineError
						? `\n${inlineErrorBar}${color.yellow((this as { inlineError: string }).inlineError)}`
						: '';
					return `${title}${defaultPrefix}${userInput}${inlineError}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<Date | symbol>;
};
