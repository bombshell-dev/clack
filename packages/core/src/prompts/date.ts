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

/** Convert Date directly to segment values - no string parsing needed */
function dateToSegmentValues(date: Date | undefined): DateParts {
	if (!date) {
		return { year: '____', month: '__', day: '__' };
	}
	return {
		year: String(date.getFullYear()).padStart(4, '0'),
		month: String(date.getMonth() + 1).padStart(2, '0'),
		day: String(date.getDate()).padStart(2, '0'),
	};
}

function segmentValuesToParsed(parts: DateParts): { year: number; month: number; day: number } {
	const val = (s: string) => Number.parseInt((s || '0').replace(/_/g, '0'), 10) || 0;
	return {
		year: val(parts.year),
		month: val(parts.month),
		day: val(parts.day),
	};
}

function daysInMonth(year: number, month: number): number {
	return new Date(year || 2000, month || 1, 0).getDate();
}

function clampSegment(
	value: number,
	type: 'year' | 'month' | 'day',
	context: { year: number; month: number }
): number {
	if (type === 'year') {
		return Math.max(1000, Math.min(9999, value || 1000));
	}
	if (type === 'month') {
		return Math.max(1, Math.min(12, value || 1));
	}
	// day - month-aware
	const { year, month } = context;
	return Math.max(1, Math.min(daysInMonth(year, month), value || 1));
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
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return undefined;
	}
	return { year, month, day };
}

/** Build a Date from segment values using local midnight so getFullYear/getMonth/getDate are timezone-stable. */
function segmentValuesToDate(parts: DateParts): Date | undefined {
	const parsed = segmentValuesToParts(parts);
	if (!parsed) return undefined;
	return new Date(parsed.year, parsed.month - 1, parsed.day);
}

function segmentValuesToISOString(parts: DateParts): string | undefined {
	const parsed = segmentValuesToParts(parts);
	if (!parsed) return undefined;
	// Use UTC so toISOString().slice(0,10) is consistent (YYYY-MM-DD)
	return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).toISOString().slice(0, 10);
}

function getSegmentValidationMessage(parts: DateParts, seg: SegmentConfig): string | undefined {
	const { year, month, day } = segmentValuesToParsed(parts);
	if (seg.type === 'month' && (month < 1 || month > 12)) {
		return settings.date.messages.invalidMonth;
	}
	if (seg.type === 'day') {
		if (day < 1) return undefined; // incomplete
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
	/** Segment-based cursor: { segmentIndex, positionInSegment } */
	#cursor: { segmentIndex: number; positionInSegment: number } = {
		segmentIndex: 0,
		positionInSegment: 0,
	};

	/** Inline validation message shown beneath input during editing (e.g. "There are only 12 months") */
	inlineError = '';

	#refreshFromSegmentValues() {
		const display = this.#config.format(this.#segmentValues);
		this._setUserInput(display);
		this._setValue(segmentValuesToDate(this.#segmentValues) ?? undefined);
	}

	get cursor() {
		// Convert segment cursor to absolute position for backward compatibility
		// Calculate start position by summing previous segments' lengths + separators
		let start = 0;
		for (let i = 0; i < this.#cursor.segmentIndex; i++) {
			start += this.#config.segments[i].len + 1; // +1 for separator
		}
		return start + this.#cursor.positionInSegment;
	}

	/** Get current segment cursor position */
	get segmentCursor() {
		return { ...this.#cursor };
	}

	/** Get current segment values for rendering in prompts layer */
	get segmentValues(): DateParts {
		return { ...this.#segmentValues };
	}

	constructor(opts: DateOptions) {
		const config = opts.formatConfig;
		// Convert Date directly to segment values - no string parsing needed
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

		this._setUserInput(initialDisplay);
		// Initialize cursor to first segment, position 0
		this.#cursor = { segmentIndex: 0, positionInSegment: 0 };
		this._setValue(segmentValuesToDate(this.#segmentValues) ?? undefined);

		this.on('cursor', (key) => this.#onCursor(key));
		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('finalize', () => this.#onFinalize(opts));
	}

	/** Get current segment and ensure cursor is valid */
	#getCurrentSegment(): { segment: SegmentConfig; index: number } | undefined {
		const index = Math.max(
			0,
			Math.min(this.#config.segments.length - 1, this.#cursor.segmentIndex)
		);
		const seg = this.#config.segments[index];
		if (!seg) return undefined;
		// Ensure positionInSegment is within bounds
		this.#cursor.positionInSegment = Math.max(
			0,
			Math.min(seg.len - 1, this.#cursor.positionInSegment)
		);
		return { segment: seg, index };
	}

	#onCursor(key?: string) {
		if (!key) return;
		const ctx = this.#getCurrentSegment();
		if (!ctx) return;

		if (key === 'left' || key === 'right') {
			this.inlineError = '';
			const delta = key === 'left' ? -1 : 1;
			const newPosInSeg = this.#cursor.positionInSegment + delta;

			// Move within segment first, then between segments
			if (newPosInSeg >= 0 && newPosInSeg < ctx.segment.len) {
				this.#cursor.positionInSegment = newPosInSeg;
				return;
			}

			// Move to next/prev segment
			const newIndex = Math.max(0, Math.min(this.#config.segments.length - 1, ctx.index + delta));
			this.#cursor.segmentIndex = newIndex;
			// Always start at beginning of segment for left-to-right digit-by-digit editing
			this.#cursor.positionInSegment = 0;
			return;
		}

		if (key === 'up' || key === 'down') {
			const context = segmentValuesToParsed(this.#segmentValues);
			const seg = ctx.segment;
			const raw = this.#segmentValues[seg.type];
			const isBlank = !raw || raw.replace(/_/g, '') === '';
			const num = Number.parseInt((raw || '0').replace(/_/g, '0'), 10) || 0;

			const bounds = getSegmentBounds(seg.type, context, this.#minDate, this.#maxDate);

			let newNum: number;
			if (isBlank) {
				newNum = key === 'up' ? bounds.min : bounds.max;
			} else {
				const delta = key === 'up' ? 1 : -1;
				newNum = Math.max(bounds.min, Math.min(bounds.max, num + delta));
			}

			const len = seg.len;
			const newSegmentValue = String(newNum).padStart(len, '0');
			this.#segmentValues = { ...this.#segmentValues, [seg.type]: newSegmentValue };
			this.#refreshFromSegmentValues();
		}
	}

	#onKey(char: string | undefined, key: Key) {
		// Backspace at position 0 may send char instead of key.name on some terminals
		const isBackspace =
			key?.name === 'backspace' ||
			key?.sequence === '\x7f' || // DEL (common on Mac/Linux)
			key?.sequence === '\b' || // BS
			char === '\x7f' || // char when key.name missing (e.g. at line start)
			char === '\b';
		if (isBackspace) {
			this.inlineError = '';
			const ctx = this.#getCurrentSegment();
			if (!ctx) return;
			const seg = ctx.segment;
			const segmentVal = this.#segmentValues[seg.type];
			if (!segmentVal.replace(/_/g, '')) return; // Already blank

			// Clear entire segment on backspace at any position
			this.#segmentValues[seg.type] = '_'.repeat(seg.len);
			this.#refreshFromSegmentValues();
			this.#cursor.positionInSegment = 0;
			return;
		}

		if (char && /^[0-9]$/.test(char)) {
			const ctx = this.#getCurrentSegment();
			if (!ctx) return;
			const seg = ctx.segment;
			const segmentDisplay = this.#segmentValues[seg.type];

			const firstBlank = segmentDisplay.indexOf('_');
			const pos =
				firstBlank >= 0 ? firstBlank : Math.min(this.#cursor.positionInSegment, seg.len - 1);
			if (pos < 0 || pos >= seg.len) return;

			const newSegmentVal = segmentDisplay.slice(0, pos) + char + segmentDisplay.slice(pos + 1);

			if (!newSegmentVal.includes('_')) {
				const newParts = { ...this.#segmentValues, [seg.type]: newSegmentVal };
				const validationMsg = getSegmentValidationMessage(newParts, seg);
				if (validationMsg) {
					this.inlineError = validationMsg;
					return;
				}
			}
			this.inlineError = '';

			this.#segmentValues[seg.type] = newSegmentVal;
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
				// Auto-jump to next segment
				this.#cursor.segmentIndex = ctx.index + 1;
				this.#cursor.positionInSegment = 0;
			} else {
				this.#cursor.positionInSegment = Math.min(pos + 1, seg.len - 1);
			}
		}
	}

	#onFinalize(opts: DateOptions) {
		this.value = segmentValuesToDate(this.#segmentValues) ?? opts.defaultValue ?? undefined;
	}
}
