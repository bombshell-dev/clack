import { styleText } from 'node:util';
import type { DateFormat, State } from '@clack/core';
import { DatePrompt, settings } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

export type { DateFormat };

/**
 * Options for the {@link date} prompt.
 */
export interface DateOptions extends CommonOptions {
	/**
	 * The message to display to the user.
	 */
	message: string;

	/**
	 * The date format for the input segments.
	 */
	format?: DateFormat;

	/**
	 * The locale to use for formatting (e.g., `'en-US'`, `'de-DE'`).
	 */
	locale?: string;

	/**
	 * The default value returned when the user cancels without selecting a date.
	 */
	defaultValue?: Date;

	/**
	 * The initial date value to pre-fill the input with.
	 */
	initialValue?: Date;

	/**
	 * The minimum allowed date for validation.
	 */
	minDate?: Date;

	/**
	 * The maximum allowed date for validation.
	 */
	maxDate?: Date;

	/**
	 * Custom validation function for the selected date.
	 */
	validate?: (value: Date | undefined) => string | Error | undefined;
}

/**
 * The `date` prompt provides an interactive date picker for selecting a date.
 * Users can navigate between year, month, and day segments and increment or
 * decrement values using keyboard controls.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#date-input
 *
 * @example
 * ```ts
 * import { date } from '@clack/prompts';
 *
 * const birthday = await date({
 *   message: 'Pick your birthday',
 *   minDate: new Date('1900-01-01'),
 *   maxDate: new Date(),
 *   initialValue: new Date(),
 * });
 * ```
 */
export const date = (opts: DateOptions) => {
	const validate = opts.validate;
	return new DatePrompt({
		...opts,
		validate(value: Date | undefined) {
			if (value === undefined) {
				if (opts.defaultValue !== undefined) return undefined;
				if (validate) return validate(value);
				return settings.date.messages.required;
			}
			const iso = (d: Date) => d.toISOString().slice(0, 10);
			if (opts.minDate && iso(value) < iso(opts.minDate)) {
				return settings.date.messages.afterMin(opts.minDate);
			}
			if (opts.maxDate && iso(value) > iso(opts.maxDate)) {
				return settings.date.messages.beforeMax(opts.maxDate);
			}
			if (validate) return validate(value);
			return undefined;
		},
		render() {
			const hasGuide = (opts?.withGuide ?? settings.withGuide) !== false;
			const titlePrefix = `${hasGuide ? `${styleText('gray', S_BAR)}\n` : ''}${symbol(this.state)}  `;
			const title = `${titlePrefix}${opts.message}\n`;

			const state = this.state !== 'initial' ? this.state : 'active';

			const userInput = renderDate(this, state);
			const value = this.value instanceof Date ? this.formattedValue : '';

			switch (this.state) {
				case 'error': {
					const errorText = this.error ? `  ${styleText('yellow', this.error)}` : '';
					const bar = hasGuide ? `${styleText('yellow', S_BAR)}  ` : '';
					const barEnd = hasGuide ? styleText('yellow', S_BAR_END) : '';
					return `${title.trim()}\n${bar}${userInput}\n${barEnd}${errorText}\n`;
				}
				case 'submit': {
					const valueText = value ? `  ${styleText('dim', value)}` : '';
					const bar = hasGuide ? styleText('gray', S_BAR) : '';
					return `${title}${bar}${valueText}`;
				}
				case 'cancel': {
					const valueText = value ? `  ${styleText(['strikethrough', 'dim'], value)}` : '';
					const bar = hasGuide ? styleText('gray', S_BAR) : '';
					return `${title}${bar}${valueText}${value.trim() ? `\n${bar}` : ''}`;
				}
				default: {
					const bar = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					const barEnd = hasGuide ? styleText('cyan', S_BAR_END) : '';
					const inlineBar = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					const inlineError = this.inlineError
						? `\n${inlineBar}${styleText('yellow', this.inlineError)}`
						: '';
					return `${title}${bar}${userInput}${inlineError}\n${barEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<Date | symbol>;
};

function renderDate(prompt: Omit<InstanceType<typeof DatePrompt>, 'prompt'>, state: State): string {
	const parts = prompt.segmentValues;
	const cursor = prompt.segmentCursor;

	if (state === 'submit' || state === 'cancel') {
		return prompt.formattedValue;
	}

	const sep = styleText('gray', prompt.separator);
	return prompt.segments
		.map((seg, i) => {
			const isActive = i === cursor.segmentIndex && !['submit', 'cancel'].includes(state);
			const label = DEFAULT_LABELS[seg.type];
			return renderSegment(parts[seg.type], { isActive, label });
		})
		.join(sep);
}

interface SegmentOptions {
	isActive: boolean;
	label: string;
}
function renderSegment(value: string, opts: SegmentOptions): string {
	const isBlank = !value || value.replace(/_/g, '') === '';
	if (opts.isActive) return styleText('inverse', isBlank ? opts.label : value.replace(/_/g, ' '));
	if (isBlank) return styleText('dim', opts.label);
	return value.replace(/_/g, styleText('dim', ' '));
}

const DEFAULT_LABELS: Record<'year' | 'month' | 'day', string> = {
	year: 'yyyy',
	month: 'mm',
	day: 'dd',
};
