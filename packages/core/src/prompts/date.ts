import type { Key } from 'node:readline';
import color from 'picocolors';
import Prompt, { type PromptOptions } from './prompt.js';

export type DateFormat = 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';

interface SegmentConfig {
	type: 'year' | 'month' | 'day';
	start: number;
	len: number;
}

interface FormatConfig {
	segments: SegmentConfig[];
	displayTemplate: string;
	format: (year: string, month: string, day: string) => string;
}

const SEGMENT_TYPES: Record<DateFormat, ('year' | 'month' | 'day')[]> = {
	'YYYY/MM/DD': ['year', 'month', 'day'],
	'MM/DD/YYYY': ['month', 'day', 'year'],
	'DD/MM/YYYY': ['day', 'month', 'year'],
};

// All formatters take (year, month, day) and return display string in format order
const formatters: Record<DateFormat, (year: string, month: string, day: string) => string> = {
	'YYYY/MM/DD': (y, m, d) => `${y}/${m}/${d}`,
	'MM/DD/YYYY': (y, m, d) => `${m}/${d}/${y}`,
	'DD/MM/YYYY': (y, m, d) => `${d}/${m}/${y}`,
};

function buildFormatConfig(format: DateFormat): FormatConfig {
	const formatFn = formatters[format];
	const displayTemplate = formatFn('____', '__', '__');
	const types = SEGMENT_TYPES[format];
	const parts = displayTemplate.split('/');
	let start = 0;
	const segments: SegmentConfig[] = parts.map((part, i) => {
		const seg: SegmentConfig = { type: types[i], start, len: part.length };
		start += part.length + 1;
		return seg;
	});
	return { segments, displayTemplate, format: formatFn };
}

const FORMAT_CONFIGS: Record<DateFormat, FormatConfig> = {
	'YYYY/MM/DD': buildFormatConfig('YYYY/MM/DD'),
	'MM/DD/YYYY': buildFormatConfig('MM/DD/YYYY'),
	'DD/MM/YYYY': buildFormatConfig('DD/MM/YYYY'),
};

function parseDisplayString(
	display: string,
	config: FormatConfig
): { year: number; month: number; day: number } {
	const result = { year: 0, month: 0, day: 0 };
	for (const seg of config.segments) {
		const val = display.slice(seg.start, seg.start + seg.len).replace(/_/g, '0') || '0';
		const num = Number.parseInt(val, 10);
		if (seg.type === 'year') result.year = num;
		else if (seg.type === 'month') result.month = num;
		else result.day = num;
	}
	return result;
}

function formatDisplayString(
	{ year, month, day }: { year: number; month: number; day: number },
	config: FormatConfig
): string {
	const y = String(year).padStart(4, '0');
	const m = String(month).padStart(2, '0');
	const d = String(day).padStart(2, '0');
	return config.format(y, m, d);
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

function toISOString(display: string, config: FormatConfig): string | undefined {
	const { year, month, day } = parseDisplayString(display, config);
	if (!year || year < 1000 || year > 9999) return undefined;
	if (!month || month < 1 || month > 12) return undefined;
	if (!day || day < 1) return undefined;
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return undefined;
	}
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

function getSegmentValidationMessage(
	newDisplay: string,
	seg: SegmentConfig,
	config: FormatConfig
): string | undefined {
	const { year, month, day } = parseDisplayString(newDisplay, config);
	if (seg.type === 'month' && (month < 1 || month > 12)) {
		return 'There are only 12 months in a year';
	}
	if (seg.type === 'day') {
		if (day < 1) return undefined; // incomplete
		const daysInMonth = new Date(year || 2000, month || 1, 0).getDate();
		if (day > daysInMonth) {
			const monthName = month >= 1 && month <= 12 ? MONTH_NAMES[month - 1] : 'this month';
			return `There are only ${daysInMonth} days in ${monthName}`;
		}
	}
	return undefined;
}

export interface DateOptions extends PromptOptions<string, DatePrompt> {
	format?: DateFormat;
	defaultValue?: string | Date;
}

export default class DatePrompt extends Prompt<string> {
	#format: DateFormat;
	#config: FormatConfig;

	/** Inline validation message shown beneath input during editing (e.g. "There are only 12 months") */
	inlineError = '';

	get cursor() {
		return this._cursor;
	}

	get userInputWithCursor() {
		const userInput = this.userInput || this.#config.displayTemplate;
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
		const initialDisplay = DatePrompt.#toDisplayString(
			opts.initialValue ?? opts.defaultValue ?? opts.initialUserInput,
			opts.format ?? 'YYYY/MM/DD'
		);
		super(
			{
				...opts,
				initialUserInput: initialDisplay,
			},
			false
		);
		this.#format = opts.format ?? 'YYYY/MM/DD';
		this.#config = FORMAT_CONFIGS[this.#format];

		this._setUserInput(initialDisplay);
		const firstSeg = this.#config.segments[0];
		// Start at beginning for left-to-right digit-by-digit editing
		this._cursor = firstSeg.start;
		this._setValue(toISOString(initialDisplay, this.#config) ?? undefined);

		this.on('cursor', (key) => this.#onCursor(key));
		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('finalize', () => this.#onFinalize(opts));
	}

	static #toDisplayString(value: string | Date | undefined, format: DateFormat): string {
		const config = FORMAT_CONFIGS[format];
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
			const { year, month, day } = parseDisplayString(
				this.userInput || this.#config.displayTemplate,
				this.#config
			);
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

			const display = formatDisplayString(
				{ year: newYear, month: newMonth, day: newDay },
				this.#config
			);
			this._setUserInput(display);
			this._setValue(toISOString(display, this.#config) ?? undefined);
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
			const display = this.userInput || this.#config.displayTemplate;
			const segmentVal = display.slice(seg.start, seg.start + seg.len);
			if (!segmentVal.replace(/_/g, '')) return; // Already blank

			// Clear entire segment on backspace at any position
			const newVal = '_'.repeat(seg.len);
			const newDisplay = display.slice(0, seg.start) + newVal + display.slice(seg.start + seg.len);
			this._setUserInput(newDisplay);
			this._cursor = seg.start; // Cursor to start of cleared segment
			this._setValue(toISOString(newDisplay, this.#config) ?? undefined);
			return;
		}

		if (char && /^[0-9]$/.test(char)) {
			const ctx = this.#getSegmentAtCursor();
			if (!ctx) return;
			const seg = ctx.segment;
			const display = this.userInput || this.#config.displayTemplate;
			const segmentDisplay = display.slice(seg.start, seg.start + seg.len);

			// Inject at leftmost blank when filling, or at cursor when editing filled segment
			// Guarantees left-to-right: "____" → "2___" → "20__" → "202_" → "2025"
			const firstBlank = segmentDisplay.indexOf('_');
			const pos = firstBlank >= 0 ? firstBlank : Math.min(this._cursor - seg.start, seg.len - 1);
			if (pos < 0 || pos >= seg.len) return;

			const newSegmentVal = segmentDisplay.slice(0, pos) + char + segmentDisplay.slice(pos + 1);
			const newDisplay =
				display.slice(0, seg.start) + newSegmentVal + display.slice(seg.start + seg.len);

			// Validate month (1-12) and day (1 to daysInMonth) when segment is full
			if (!newSegmentVal.includes('_')) {
				const validationMsg = getSegmentValidationMessage(newDisplay, seg, this.#config);
				if (validationMsg) {
					this.inlineError = validationMsg;
					return;
				}
			}
			this.inlineError = '';

			const iso = toISOString(newDisplay, this.#config);

			if (iso) {
				const { year, month, day } = parseDisplayString(newDisplay, this.#config);
				const clamped = formatDisplayString(
					{
						year: clampSegment(year, 'year', { year, month }),
						month: clampSegment(month, 'month', { year, month }),
						day: clampSegment(day, 'day', { year, month }),
					},
					this.#config
				);
				this._setUserInput(clamped);
				this._setValue(iso);
			} else {
				this._setUserInput(newDisplay);
				this._setValue(undefined);
			}

			// Cursor: next blank when filling; when segment just became full (was filling), jump to next
			const nextBlank = newSegmentVal.indexOf('_');
			const wasFilling = firstBlank >= 0; // had blanks before this keystroke
			if (nextBlank >= 0) {
				this._cursor = seg.start + nextBlank;
			} else if (wasFilling && ctx.index < this.#config.segments.length - 1) {
				// Just completed segment by filling - jump to next
				this._cursor = this.#config.segments[ctx.index + 1].start;
			} else {
				// Editing full segment - advance within or stay at end
				this._cursor = seg.start + Math.min(pos + 1, seg.len - 1);
			}
		}
	}

	#onFinalize(opts: DateOptions) {
		const display = this.userInput || this.#config.displayTemplate;
		const iso = toISOString(display, this.#config);
		if (iso) {
			this.value = iso;
		} else {
			this.value = opts.defaultValue
				? typeof opts.defaultValue === 'string'
					? opts.defaultValue
					: opts.defaultValue.toISOString().slice(0, 10)
				: undefined;
		}
	}
}
