import type { Key } from 'node:readline';
import { settings } from '../utils/settings.js';
import Prompt, { type PromptOptions } from './prompt.js';

interface SegmentConfig {
	type: 'year' | 'month' | 'day';
	len: number;
}

export interface DateParts {
	year: string;
	month: string;
	day: string;
}

/** Format config passed from prompts package; core does not define presets */
export interface DateFormatConfig {
	segments: SegmentConfig[];
	format: (parts: DateParts) => string;
	/** Labels shown when segment is blank (e.g. yyyy, mm, dd). Default: { year: 'yyyy', month: 'mm', day: 'dd' } */
	segmentLabels?: { year: string; month: string; day: string };
}

function clamp(min: number, value: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/** Convert Date directly to segment values - no string parsing needed */
function dateToSegmentValues(date: Date | undefined): DateParts {
	if (!date) {
		return { year: '____', month: '__', day: '__' };
	}
	return {
		year: String(date.getUTCFullYear()).padStart(4, '0'),
		month: String(date.getUTCMonth() + 1).padStart(2, '0'),
		day: String(date.getUTCDate()).padStart(2, '0'),
	};
}

function segmentValuesToParsed(parts: DateParts): {
	year: number;
	month: number;
	day: number;
} {
	const val = (s: string) => Number.parseInt((s || '0').replace(/_/g, '0'), 10) || 0;
	return {
		year: val(parts.year),
		month: val(parts.month),
		day: val(parts.day),
	};
}

function daysInMonth(year: number, month: number): number {
	return new Date(year || 2001, month || 1, 0).getDate();
}

function clampSegment(
	value: number,
	type: 'year' | 'month' | 'day',
	context: { year: number; month: number }
): number {
	if (type === 'year') {
		return clamp(1000, value || 1000, 9999);
	}
	if (type === 'month') {
		return clamp(1, value || 1, 12);
	}
	const { year, month } = context;
	return clamp(1, value || 1, daysInMonth(year, month));
}

function datePartsUTC(d: Date): { year: number; month: number; day: number } {
	return {
		year: d.getUTCFullYear(),
		month: d.getUTCMonth() + 1,
		day: d.getUTCDate(),
	};
}

function getSegmentBounds(
	type: 'year' | 'month' | 'day',
	context: { year: number; month: number; day: number },
	minDate: Date | undefined,
	maxDate: Date | undefined
): { min: number; max: number } {
	const { year, month } = context;
	const minParts = minDate ? datePartsUTC(minDate) : null;
	const maxParts = maxDate ? datePartsUTC(maxDate) : null;

	if (type === 'year') {
		const min = minParts ? minParts.year : 1000;
		const max = maxParts ? maxParts.year : 9999;
		return { min, max };
	}
	if (type === 'month') {
		let min = 1;
		let max = 12;
		if (minParts && year && year >= minParts.year) {
			if (year === minParts.year) min = minParts.month;
		}
		if (maxParts && year && year <= maxParts.year) {
			if (year === maxParts.year) max = maxParts.month;
		}
		return { min, max };
	}
	// day
	let min = 1;
	let max = daysInMonth(year, month);
	if (minParts && year && month && year === minParts.year && month === minParts.month) {
		min = minParts.day;
	}
	if (maxParts && year && month && year === maxParts.year && month === maxParts.month) {
		max = maxParts.day;
	}
	return { min, max };
}

/** Parse segment values to calendar parts; returns undefined if invalid. */
function segmentValuesToParts(
	parts: DateParts
): { year: number; month: number; day: number } | undefined {
	const { year, month, day } = segmentValuesToParsed(parts);
	if (!year || year < 1000 || year > 9999) return undefined;
	if (!month || month < 1 || month > 12) return undefined;
	if (!day || day < 1) return undefined;
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return undefined;
	}
	return { year, month, day };
}

/** Build a Date from segment values using UTC midnight so getFullYear/getMonth/getDate are timezone-stable. */
function segmentValuesToDate(parts: DateParts): Date | undefined {
	const parsed = segmentValuesToParts(parts);
	if (!parsed) return undefined;
	return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
}

function segmentValuesToISOString(parts: DateParts): string | undefined {
	const parsed = segmentValuesToParts(parts);
	if (!parsed) return undefined;
	return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).toISOString().slice(0, 10);
}

function getSegmentValidationMessage(parts: DateParts, seg: SegmentConfig): string | undefined {
	const { year, month, day } = segmentValuesToParsed(parts);
	if (seg.type === 'month' && (month < 1 || month > 12)) {
		return settings.date.messages.invalidMonth;
	}
	if (seg.type === 'day') {
		if (day < 1) return undefined;
		if (day > daysInMonth(year, month)) {
			const monthName =
				month >= 1 && month <= 12 ? settings.date.monthNames[month - 1] : 'this month';
			return settings.date.messages.invalidDay(daysInMonth(year, month), monthName);
		}
	}
	return undefined;
}

export interface DateOptions extends PromptOptions<Date, DatePrompt> {
	formatConfig: DateFormatConfig;
	defaultValue?: Date;
	initialValue?: Date;
	minDate?: Date;
	maxDate?: Date;
}

export default class DatePrompt extends Prompt<Date> {
	#config: DateFormatConfig;
	#segmentValues: DateParts;
	#minDate: Date | undefined;
	#maxDate: Date | undefined;
	#cursor = { segmentIndex: 0, positionInSegment: 0 };

	/** Inline validation message shown beneath input during editing */
	inlineError = '';

	#refreshFromSegmentValues() {
		const display = this.#config.format(this.#segmentValues);
		this._setUserInput(display);
		this._setValue(segmentValuesToDate(this.#segmentValues) ?? undefined);
	}

	get segmentCursor() {
		return { ...this.#cursor };
	}

	get segmentValues(): DateParts {
		return { ...this.#segmentValues };
	}

	constructor(opts: DateOptions) {
		const config = opts.formatConfig;
		const initialDate = opts.initialValue ?? opts.defaultValue;
		const segmentValues = dateToSegmentValues(initialDate);
		const initialDisplay = config.format(segmentValues);

		super(
			{
				...opts,
				initialUserInput: initialDisplay,
			},
			false
		);
		this.#config = config;
		this.#segmentValues = segmentValues;
		this.#minDate = opts.minDate;
		this.#maxDate = opts.maxDate;
		this.#refreshFromSegmentValues();

		this.on('cursor', (key) => this.#onCursor(key));
		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('finalize', () => this.#onFinalize(opts));
	}

	#getCurrentSegment(): { segment: SegmentConfig; index: number } | undefined {
		const index = clamp(0, this.#cursor.segmentIndex, this.#config.segments.length - 1);
		const segment = this.#config.segments[index];
		if (!segment) return undefined;
		this.#cursor.positionInSegment = clamp(0, this.#cursor.positionInSegment, segment.len - 1);
		return { segment, index };
	}

	#moveCursorNext() {
		this.inlineError = '';
		const ctx = this.#getCurrentSegment();
		if (!ctx) return;
		const newPos = this.#cursor.positionInSegment + 1;
		if (newPos < ctx.segment.len) {
			this.#cursor.positionInSegment = newPos;
			return;
		}
		const newIndex = Math.min(this.#config.segments.length - 1, ctx.index + 1);
		this.#cursor.segmentIndex = newIndex;
		this.#cursor.positionInSegment = 0;
	}

	#moveCursorPrevious() {
		this.inlineError = '';
		const ctx = this.#getCurrentSegment();
		if (!ctx) return;
		const newPos = this.#cursor.positionInSegment - 1;
		if (newPos >= 0) {
			this.#cursor.positionInSegment = newPos;
			return;
		}
		const newIndex = Math.max(0, ctx.index - 1);
		this.#cursor.segmentIndex = newIndex;
		this.#cursor.positionInSegment = 0;
	}

	#incrementSegment() {
		const ctx = this.#getCurrentSegment();
		if (!ctx) return;
		this.#adjustSegment(ctx, 1);
	}

	#decrementSegment() {
		const ctx = this.#getCurrentSegment();
		if (!ctx) return;
		this.#adjustSegment(ctx, -1);
	}

	#adjustSegment(ctx: { segment: SegmentConfig; index: number }, direction: 1 | -1) {
		const { segment } = ctx;
		const raw = this.#segmentValues[segment.type];
		const isBlank = !raw || raw.replace(/_/g, '') === '';
		const num = Number.parseInt((raw || '0').replace(/_/g, '0'), 10) || 0;
		const bounds = getSegmentBounds(
			segment.type,
			segmentValuesToParsed(this.#segmentValues),
			this.#minDate,
			this.#maxDate
		);

		const newNum = isBlank
			? direction === 1
				? bounds.min
				: bounds.max
			: clamp(bounds.min, num + direction, bounds.max);

		const newSegmentValue = String(newNum).padStart(segment.len, '0');
		this.#segmentValues = {
			...this.#segmentValues,
			[segment.type]: newSegmentValue,
		};
		this.#refreshFromSegmentValues();
	}

	#onCursor(key?: string) {
		if (!key) return;
		switch (key) {
			case 'right':
				return this.#moveCursorNext();
			case 'left':
				return this.#moveCursorPrevious();
			case 'up':
				return this.#incrementSegment();
			case 'down':
				return this.#decrementSegment();
		}
	}

	#onKey(char: string | undefined, key: Key) {
		const isBackspace =
			key?.name === 'backspace' ||
			key?.sequence === '\x7f' ||
			key?.sequence === '\b' ||
			char === '\x7f' ||
			char === '\b';
		if (isBackspace) {
			this.inlineError = '';
			const ctx = this.#getCurrentSegment();
			if (!ctx) return;
			const { segment } = ctx;
			const segmentVal = this.#segmentValues[segment.type];
			if (!segmentVal.replace(/_/g, '')) return;

			this.#segmentValues[segment.type] = '_'.repeat(segment.len);
			this.#refreshFromSegmentValues();
			this.#cursor.positionInSegment = 0;
			return;
		}

		if (char && /^[0-9]$/.test(char)) {
			const ctx = this.#getCurrentSegment();
			if (!ctx) return;
			const { segment } = ctx;
			const segmentDisplay = this.#segmentValues[segment.type];

			const firstBlank = segmentDisplay.indexOf('_');
			const pos =
				firstBlank >= 0 ? firstBlank : Math.min(this.#cursor.positionInSegment, segment.len - 1);
			if (pos < 0 || pos >= segment.len) return;

			const newSegmentVal = segmentDisplay.slice(0, pos) + char + segmentDisplay.slice(pos + 1);

			if (!newSegmentVal.includes('_')) {
				const newParts = {
					...this.#segmentValues,
					[segment.type]: newSegmentVal,
				};
				const validationMsg = getSegmentValidationMessage(newParts, segment);
				if (validationMsg) {
					this.inlineError = validationMsg;
					return;
				}
			}
			this.inlineError = '';

			this.#segmentValues[segment.type] = newSegmentVal;
			const iso = segmentValuesToISOString(this.#segmentValues);

			if (iso) {
				const { year, month, day } = segmentValuesToParsed(this.#segmentValues);
				this.#segmentValues = {
					year: String(clampSegment(year, 'year', { year, month })).padStart(4, '0'),
					month: String(clampSegment(month, 'month', { year, month })).padStart(2, '0'),
					day: String(clampSegment(day, 'day', { year, month })).padStart(2, '0'),
				};
			}
			this.#refreshFromSegmentValues();

			const nextBlank = newSegmentVal.indexOf('_');
			const wasFilling = firstBlank >= 0;
			if (nextBlank >= 0) {
				this.#cursor.positionInSegment = nextBlank;
			} else if (wasFilling && ctx.index < this.#config.segments.length - 1) {
				this.#cursor.segmentIndex = ctx.index + 1;
				this.#cursor.positionInSegment = 0;
			} else {
				this.#cursor.positionInSegment = Math.min(pos + 1, segment.len - 1);
			}
		}
	}

	#onFinalize(opts: DateOptions) {
		this.value = segmentValuesToDate(this.#segmentValues) ?? opts.defaultValue ?? undefined;
	}
}
