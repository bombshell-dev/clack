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

export type DateFormat = 'YMD' | 'MDY' | 'DMY';

const SEGMENTS: Record<string, SegmentConfig> = { Y: { type: 'year', len: 4 }, M: { type: 'month', len: 2 }, D: { type: 'day', len: 2 } } as const;

function segmentsFor(fmt: DateFormat): SegmentConfig[] {
	return [...fmt].map((c) => SEGMENTS[c as keyof typeof SEGMENTS]);
}

function detectLocaleFormat(locale?: string): { segments: SegmentConfig[]; separator: string } {
	const fmt = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});
	const parts = fmt.formatToParts(new Date(2000, 0, 15));
	const segments: SegmentConfig[] = [];
	let separator = '/';
	for (const p of parts) {
		if (p.type === 'literal') {
			separator = p.value.trim() || p.value;
		} else if (p.type === 'year' || p.type === 'month' || p.type === 'day') {
			segments.push({ type: p.type, len: p.type === 'year' ? 4 : 2 });
		}
	}
	return { segments, separator };
}

/** Parse string segment values to numbers, treating blanks as 0 */
function parse(parts: DateParts): { year: number; month: number; day: number } {
	const n = (s: string) => Number.parseInt((s || '0').replace(/_/g, '0'), 10) || 0;
	return { year: n(parts.year), month: n(parts.month), day: n(parts.day) };
}

function daysInMonth(year: number, month: number): number {
	return new Date(year || 2001, month || 1, 0).getDate();
}

/** Validate and return calendar parts, or undefined if invalid */
function validParts(
	parts: DateParts
): { year: number; month: number; day: number } | undefined {
	const { year, month, day } = parse(parts);
	if (!year || year < 0 || year > 9999) return undefined;
	if (!month || month < 1 || month > 12) return undefined;
	if (!day || day < 1) return undefined;
	const d = new Date(Date.UTC(year, month - 1, day));
	if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day)
		return undefined;
	return { year, month, day };
}

function toDate(parts: DateParts): Date | undefined {
	const p = validParts(parts);
	return p ? new Date(Date.UTC(p.year, p.month - 1, p.day)) : undefined;
}

function segmentBounds(
	type: 'year' | 'month' | 'day',
	ctx: { year: number; month: number },
	minDate: Date | undefined,
	maxDate: Date | undefined
): { min: number; max: number } {
	const minP = minDate
		? { year: minDate.getUTCFullYear(), month: minDate.getUTCMonth() + 1, day: minDate.getUTCDate() }
		: null;
	const maxP = maxDate
		? { year: maxDate.getUTCFullYear(), month: maxDate.getUTCMonth() + 1, day: maxDate.getUTCDate() }
		: null;

	if (type === 'year') {
		return { min: minP?.year ?? 1, max: maxP?.year ?? 9999 };
	}
	if (type === 'month') {
		return {
			min: minP && ctx.year === minP.year ? minP.month : 1,
			max: maxP && ctx.year === maxP.year ? maxP.month : 12,
		};
	}
	return {
		min: minP && ctx.year === minP.year && ctx.month === minP.month ? minP.day : 1,
		max: maxP && ctx.year === maxP.year && ctx.month === maxP.month ? maxP.day : daysInMonth(ctx.year, ctx.month),
	};
}

export interface DateOptions extends PromptOptions<Date, DatePrompt> {
	format?: DateFormat;
	locale?: string;
	separator?: string;
	defaultValue?: Date;
	initialValue?: Date;
	minDate?: Date;
	maxDate?: Date;
}

export default class DatePrompt extends Prompt<Date> {
	#segments: SegmentConfig[];
	#separator: string;
	#segmentValues: DateParts;
	#minDate: Date | undefined;
	#maxDate: Date | undefined;
	#cursor = { segmentIndex: 0, positionInSegment: 0 };
	#segmentSelected = true;
	#pendingTensDigit: string | null = null;

	inlineError = '';

	get segmentCursor() {
		return { ...this.#cursor };
	}

	get segmentValues(): DateParts {
		return { ...this.#segmentValues };
	}

	get segments(): readonly SegmentConfig[] {
		return this.#segments;
	}

	get separator(): string {
		return this.#separator;
	}

	get formattedValue(): string {
		return this.#format(this.#segmentValues);
	}

	#format(parts: DateParts): string {
		return this.#segments.map((s) => parts[s.type]).join(this.#separator);
	}

	#refresh() {
		this._setUserInput(this.#format(this.#segmentValues));
		this._setValue(toDate(this.#segmentValues) ?? undefined);
	}

	constructor(opts: DateOptions) {
		const detected = opts.format
			? { segments: segmentsFor(opts.format), separator: opts.separator ?? '/' }
			: detectLocaleFormat(opts.locale);
		const sep = opts.separator ?? detected.separator;
		const segments = opts.format ? segmentsFor(opts.format) : detected.segments;

		const initialDate = opts.initialValue ?? opts.defaultValue;
		const segmentValues: DateParts = initialDate
			? {
					year: String(initialDate.getUTCFullYear()).padStart(4, '0'),
					month: String(initialDate.getUTCMonth() + 1).padStart(2, '0'),
					day: String(initialDate.getUTCDate()).padStart(2, '0'),
				}
			: { year: '____', month: '__', day: '__' };

		const initialDisplay = segments.map((s) => segmentValues[s.type]).join(sep);

		super({ ...opts, initialUserInput: initialDisplay }, false);
		this.#segments = segments;
		this.#separator = sep;
		this.#segmentValues = segmentValues;
		this.#minDate = opts.minDate;
		this.#maxDate = opts.maxDate;
		this.#refresh();

		this.on('cursor', (key) => this.#onCursor(key));
		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('finalize', () => this.#onFinalize(opts));
	}

	#seg(): { segment: SegmentConfig; index: number } | undefined {
		const index = Math.max(0, Math.min(this.#cursor.segmentIndex, this.#segments.length - 1));
		const segment = this.#segments[index];
		if (!segment) return undefined;
		this.#cursor.positionInSegment = Math.max(0, Math.min(this.#cursor.positionInSegment, segment.len - 1));
		return { segment, index };
	}

	#navigate(direction: 1 | -1) {
		this.inlineError = '';
		this.#pendingTensDigit = null;
		const ctx = this.#seg();
		if (!ctx) return;
		this.#cursor.segmentIndex = Math.max(0, Math.min(this.#segments.length - 1, ctx.index + direction));
		this.#cursor.positionInSegment = 0;
		this.#segmentSelected = true;
	}

	#adjust(direction: 1 | -1) {
		const ctx = this.#seg();
		if (!ctx) return;
		const { segment } = ctx;
		const raw = this.#segmentValues[segment.type];
		const isBlank = !raw || raw.replace(/_/g, '') === '';
		const num = Number.parseInt((raw || '0').replace(/_/g, '0'), 10) || 0;
		const bounds = segmentBounds(segment.type, parse(this.#segmentValues), this.#minDate, this.#maxDate);

		let next: number;
		if (isBlank) {
			next = direction === 1 ? bounds.min : bounds.max;
		} else {
			next = Math.max(Math.min(bounds.max, num + direction), bounds.min);
		}

		this.#segmentValues = { ...this.#segmentValues, [segment.type]: String(next).padStart(segment.len, '0') };
		this.#segmentSelected = true;
		this.#pendingTensDigit = null;
		this.#refresh();
	}

	#onCursor(key?: string) {
		if (!key) return;
		switch (key) {
			case 'right': return this.#navigate(1);
			case 'left': return this.#navigate(-1);
			case 'up': return this.#adjust(1);
			case 'down': return this.#adjust(-1);
		}
	}

	#onKey(char: string | undefined, key: Key) {
		// Backspace
		const isBackspace =
			key?.name === 'backspace' || key?.sequence === '\x7f' || key?.sequence === '\b' ||
			char === '\x7f' || char === '\b';
		if (isBackspace) {
			this.inlineError = '';
			const ctx = this.#seg();
			if (!ctx) return;
			if (!this.#segmentValues[ctx.segment.type].replace(/_/g, '')) {
				this.#navigate(-1);
				return;
			}
			this.#segmentValues[ctx.segment.type] = '_'.repeat(ctx.segment.len);
			this.#segmentSelected = true;
			this.#cursor.positionInSegment = 0;
			this.#refresh();
			return;
		}

		// Tab navigation
		if (key?.name === 'tab') {
			this.inlineError = '';
			const ctx = this.#seg();
			if (!ctx) return;
			const dir = key.shift ? -1 : 1;
			const next = ctx.index + dir;
			if (next >= 0 && next < this.#segments.length) {
				this.#cursor.segmentIndex = next;
				this.#cursor.positionInSegment = 0;
				this.#segmentSelected = true;
			}
			return;
		}

		// Digit input
		if (char && /^[0-9]$/.test(char)) {
			const ctx = this.#seg();
			if (!ctx) return;
			const { segment } = ctx;
			const isBlank = !this.#segmentValues[segment.type].replace(/_/g, '');

			// Pending tens digit: complete the two-digit entry
			if (this.#segmentSelected && this.#pendingTensDigit !== null && !isBlank) {
				const newVal = this.#pendingTensDigit + char;
				const newParts = { ...this.#segmentValues, [segment.type]: newVal };
				const err = this.#validateSegment(newParts, segment);
				if (err) {
					this.inlineError = err;
					this.#pendingTensDigit = null;
					this.#segmentSelected = false;
					return;
				}
				this.inlineError = '';
				this.#segmentValues[segment.type] = newVal;
				this.#pendingTensDigit = null;
				this.#segmentSelected = false;
				this.#refresh();
				if (ctx.index < this.#segments.length - 1) {
					this.#cursor.segmentIndex = ctx.index + 1;
					this.#cursor.positionInSegment = 0;
					this.#segmentSelected = true;
				}
				return;
			}

			// Clear-on-type: typing into a selected filled segment clears it first
			if (this.#segmentSelected && !isBlank) {
				this.#segmentValues[segment.type] = '_'.repeat(segment.len);
				this.#cursor.positionInSegment = 0;
			}
			this.#segmentSelected = false;
			this.#pendingTensDigit = null;

			const display = this.#segmentValues[segment.type];
			const firstBlank = display.indexOf('_');
			const pos = firstBlank >= 0 ? firstBlank : Math.min(this.#cursor.positionInSegment, segment.len - 1);
			if (pos < 0 || pos >= segment.len) return;

			let newVal = display.slice(0, pos) + char + display.slice(pos + 1);

			// Smart digit placement
			let shouldStaySelected = false;
			if (pos === 0 && display === '__' && (segment.type === 'month' || segment.type === 'day')) {
				const digit = Number.parseInt(char, 10);
				newVal = `0${char}`;
				shouldStaySelected = digit <= (segment.type === 'month' ? 1 : 2);
			}
			if (segment.type === 'year') {
				const digits = display.replace(/_/g, '');
				newVal = (digits + char).padStart(segment.len, '_');
			}

			if (!newVal.includes('_')) {
				const newParts = { ...this.#segmentValues, [segment.type]: newVal };
				const err = this.#validateSegment(newParts, segment);
				if (err) {
					this.inlineError = err;
					return;
				}
			}
			this.inlineError = '';

			this.#segmentValues[segment.type] = newVal;

			// Clamp only when the current segment is fully entered
			const parsed = !newVal.includes('_') ? validParts(this.#segmentValues) : undefined;
			if (parsed) {
				const { year, month } = parsed;
				const maxDay = daysInMonth(year, month);
				this.#segmentValues = {
					year: String(Math.max(0, Math.min(9999, year))).padStart(4, '0'),
					month: String(Math.max(1, Math.min(12, month))).padStart(2, '0'),
					day: String(Math.max(1, Math.min(maxDay, parsed.day))).padStart(2, '0'),
				};
			}
			this.#refresh();

			// Advance cursor
			const nextBlank = newVal.indexOf('_');
			if (shouldStaySelected) {
				this.#segmentSelected = true;
				this.#pendingTensDigit = char;
			} else if (nextBlank >= 0) {
				this.#cursor.positionInSegment = nextBlank;
			} else if (firstBlank >= 0 && ctx.index < this.#segments.length - 1) {
				this.#cursor.segmentIndex = ctx.index + 1;
				this.#cursor.positionInSegment = 0;
				this.#segmentSelected = true;
			} else {
				this.#cursor.positionInSegment = Math.min(pos + 1, segment.len - 1);
			}
		}
	}

	#validateSegment(parts: DateParts, seg: SegmentConfig): string | undefined {
		const { month, day } = parse(parts);
		if (seg.type === 'month' && (month < 0 || month > 12)) {
			return settings.date.messages.invalidMonth;
		}
		if (seg.type === 'day' && (day < 0 || day > 31)) {
			return settings.date.messages.invalidDay(31, 'any month');
		}
		return undefined;
	}

	#onFinalize(opts: DateOptions) {
		const { year, month, day } = parse(this.#segmentValues);
		if (year && month && day) {
			const maxDay = daysInMonth(year, month);
			this.#segmentValues = {
				...this.#segmentValues,
				day: String(Math.min(day, maxDay)).padStart(2, '0'),
			};
		}
		this.value = toDate(this.#segmentValues) ?? opts.defaultValue ?? undefined;
	}
}
