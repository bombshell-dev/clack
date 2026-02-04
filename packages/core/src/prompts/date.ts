import type { Key } from 'node:readline';
import color from 'picocolors';
import { settings } from '../utils/settings.js';
import Prompt, { type PromptOptions } from './prompt.js';

interface SegmentConfig {
	type: 'year' | 'month' | 'day';
	start: number;
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
	displayTemplate: string;
	format: (parts: DateParts) => string;
}

function displayToSegmentValues(display: string, config: DateFormatConfig): DateParts {
	const blank: DateParts = { year: '____', month: '__', day: '__' };
	for (const seg of config.segments) {
		blank[seg.type] = display.slice(seg.start, seg.start + seg.len);
	}
	return blank;
}

function segmentValuesToParsed(parts: DateParts): { year: number; month: number; day: number } {
	const val = (s: string) => Number.parseInt((s || '0').replace(/_/g, '0'), 10) || 0;
	return {
		year: val(parts.year),
		month: val(parts.month),
		day: val(parts.day),
	};
}

function parseDisplayString(
	display: string,
	config: DateFormatConfig
): { year: number; month: number; day: number } {
	return segmentValuesToParsed(displayToSegmentValues(display, config));
}

function formatDisplayString(
	{ year, month, day }: { year: number; month: number; day: number },
	config: DateFormatConfig
): string {
	const parts: DateParts = {
		year: String(year).padStart(4, '0'),
		month: String(month).padStart(2, '0'),
		day: String(day).padStart(2, '0'),
	};
	return config.format(parts);
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
	const daysInMonth = new Date(year || 2000, month || 1, 0).getDate();
	return Math.max(1, Math.min(daysInMonth, value || 1));
}

function toISOString(display: string, config: DateFormatConfig): string | undefined {
	const { year, month, day } = parseDisplayString(display, config);
	if (!year || year < 1000 || year > 9999) return undefined;
	if (!month || month < 1 || month > 12) return undefined;
	if (!day || day < 1) return undefined;
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return undefined;
	}
	// Use UTC to avoid timezone shifting the date part of toISOString()
	return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function getSegmentValidationMessage(
	newDisplay: string,
	seg: SegmentConfig,
	config: DateFormatConfig
): string | undefined {
	const { year, month, day } = parseDisplayString(newDisplay, config);
	if (seg.type === 'month' && (month < 1 || month > 12)) {
		return settings.date.messages.invalidMonth;
	}
	if (seg.type === 'day') {
		if (day < 1) return undefined; // incomplete
		const daysInMonth = new Date(year || 2000, month || 1, 0).getDate();
		if (day > daysInMonth) {
			const monthName =
				month >= 1 && month <= 12 ? settings.date.monthNames[month - 1] : 'this month';
			return settings.date.messages.invalidDay(daysInMonth, monthName);
		}
	}
	return undefined;
}

export interface DateOptions extends PromptOptions<Date, DatePrompt> {
	formatConfig: DateFormatConfig;
	defaultValue?: Date;
	initialValue?: Date;
}

export default class DatePrompt extends Prompt<Date> {
	#config: DateFormatConfig;
	/** Segment values as source of truth; display derived from this */
	#segmentValues: DateParts;

	/** Inline validation message shown beneath input during editing (e.g. "There are only 12 months") */
	inlineError = '';

	#refreshFromSegmentValues() {
		const display = this.#config.format(this.#segmentValues);
		this._setUserInput(display);
		const iso = toISOString(display, this.#config);
		this._setValue(iso ? new Date(iso) : undefined);
	}

	get cursor() {
		return this._cursor;
	}

	get userInputWithCursor() {
		const userInput = this.#config.format(this.#segmentValues);
		const sep = (ch: string) => (ch === '/' ? color.gray(ch) : ch);
		if (this.state === 'submit') {
			return userInput; // plain string for programmatic use (no ANSI)
		}
		let result = '';
		for (let i = 0; i < userInput.length; i++) {
			const ch = userInput[i];
			if (i === this._cursor) {
				result += ch === '_' ? color.inverse(' ') : color.inverse(ch);
			} else {
				result += sep(ch); // keep '_' as-is for placeholders, grey '/'
			}
		}
		if (this._cursor >= userInput.length) {
			result += '█';
		}
		return result;
	}

	constructor(opts: DateOptions) {
		const config = opts.formatConfig;
		const initialDisplay = DatePrompt.#toDisplayString(
			opts.initialValue ?? opts.defaultValue ?? (opts as { initialUserInput?: string }).initialUserInput,
			config
		);
		super(
			{
				...opts,
				initialUserInput: initialDisplay,
			},
			false
		);
		this.#config = config;
		this.#segmentValues = displayToSegmentValues(initialDisplay, config);

		this._setUserInput(initialDisplay);
		const firstSeg = this.#config.segments[0];
		this._cursor = firstSeg.start;
		const iso = toISOString(initialDisplay, this.#config);
		this._setValue(iso ? new Date(iso) : undefined);

		this.on('cursor', (key) => this.#onCursor(key));
		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('finalize', () => this.#onFinalize(opts));
	}

	static #toDisplayString(value: Date | string | undefined, config: DateFormatConfig): string {
		if (!value) return config.displayTemplate;
		if (value instanceof Date) {
			return formatDisplayString(
				{
					year: value.getFullYear(),
					month: value.getMonth() + 1,
					day: value.getDate(),
				},
				config
			);
		}
		if (typeof value === 'string') {
			const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
			if (match) {
				return formatDisplayString(
					{
						year: Number.parseInt(match[1], 10),
						month: Number.parseInt(match[2], 10),
						day: Number.parseInt(match[3], 10),
					},
					config
				);
			}
		}
		return config.displayTemplate;
	}

	#getSegmentAtCursor(): { segment: SegmentConfig; index: number } | undefined {
		const cursor = this._cursor;
		for (let i = 0; i < this.#config.segments.length; i++) {
			const seg = this.#config.segments[i];
			if (cursor >= seg.start && cursor < seg.start + seg.len) {
				return { segment: seg, index: i };
			}
		}
		// Cursor might be on separator - find nearest segment
		for (let i = 0; i < this.#config.segments.length; i++) {
			const seg = this.#config.segments[i];
			if (cursor < seg.start) {
				return { segment: this.#config.segments[Math.max(0, i - 1)], index: Math.max(0, i - 1) };
			}
		}
		return {
			segment: this.#config.segments[this.#config.segments.length - 1],
			index: this.#config.segments.length - 1,
		};
	}

	#onCursor(key?: string) {
		if (!key) return;
		const ctx = this.#getSegmentAtCursor();
		if (!ctx) return;

		if (key === 'left' || key === 'right') {
			this.inlineError = '';
			const seg = ctx.segment;
			const posInSeg = this._cursor - seg.start;
			const delta = key === 'left' ? -1 : 1;
			// Move within segment first, then between segments
			const newPosInSeg = posInSeg + delta;
			if (newPosInSeg >= 0 && newPosInSeg < seg.len) {
				this._cursor = seg.start + newPosInSeg;
				return;
			}
			const newIndex = Math.max(0, Math.min(this.#config.segments.length - 1, ctx.index + delta));
			const newSeg = this.#config.segments[newIndex];
			// Always start at beginning of segment for left-to-right digit-by-digit editing
			this._cursor = newSeg.start;
			return;
		}

		if (key === 'up' || key === 'down') {
			const { year, month, day } = segmentValuesToParsed(this.#segmentValues);
			const seg = ctx.segment;
			const delta = key === 'up' ? 1 : -1;

			let newYear = year;
			let newMonth = month;
			let newDay = day;

			if (seg.type === 'year') {
				newYear = clampSegment(year + delta, 'year', { year, month });
			} else if (seg.type === 'month') {
				newMonth = clampSegment(month + delta, 'month', { year, month });
			} else {
				newDay = clampSegment(day + delta, 'day', { year, month });
			}

			this.#segmentValues = {
				year: String(newYear).padStart(4, '0'),
				month: String(newMonth).padStart(2, '0'),
				day: String(newDay).padStart(2, '0'),
			};
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
			const ctx = this.#getSegmentAtCursor();
			if (!ctx) return;
			const seg = ctx.segment;
			const segmentVal = this.#segmentValues[seg.type];
			if (!segmentVal.replace(/_/g, '')) return; // Already blank

			// Clear entire segment on backspace at any position
			this.#segmentValues[seg.type] = '_'.repeat(seg.len);
			this.#refreshFromSegmentValues();
			this._cursor = seg.start;
			return;
		}

		if (char && /^[0-9]$/.test(char)) {
			const ctx = this.#getSegmentAtCursor();
			if (!ctx) return;
			const seg = ctx.segment;
			const segmentDisplay = this.#segmentValues[seg.type];

			const firstBlank = segmentDisplay.indexOf('_');
			const pos = firstBlank >= 0 ? firstBlank : Math.min(this._cursor - seg.start, seg.len - 1);
			if (pos < 0 || pos >= seg.len) return;

			const newSegmentVal = segmentDisplay.slice(0, pos) + char + segmentDisplay.slice(pos + 1);

			if (!newSegmentVal.includes('_')) {
				const newDisplay = this.#config.format({
					...this.#segmentValues,
					[seg.type]: newSegmentVal,
				});
				const validationMsg = getSegmentValidationMessage(newDisplay, seg, this.#config);
				if (validationMsg) {
					this.inlineError = validationMsg;
					return;
				}
			}
			this.inlineError = '';

			this.#segmentValues[seg.type] = newSegmentVal;
			const newDisplay = this.#config.format(this.#segmentValues);
			const iso = toISOString(newDisplay, this.#config);

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
				this._cursor = seg.start + nextBlank;
			} else if (wasFilling && ctx.index < this.#config.segments.length - 1) {
				this._cursor = this.#config.segments[ctx.index + 1].start;
			} else {
				this._cursor = seg.start + Math.min(pos + 1, seg.len - 1);
			}
		}
	}

	#onFinalize(opts: DateOptions) {
		const display = this.#config.format(this.#segmentValues);
		const iso = toISOString(display, this.#config);
		this.value = iso ? new Date(iso) : opts.defaultValue ?? undefined;
	}
}
