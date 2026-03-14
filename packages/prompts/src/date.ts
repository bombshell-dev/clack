import { styleText } from 'node:util';
import type { DateFormat } from '@clack/core';
import { DatePrompt, settings } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

const DEFAULT_LABELS: Record<'year' | 'month' | 'day', string> = {
	year: 'yyyy',
	month: 'mm',
	day: 'dd',
};

function renderSegment(
	value: string,
	segmentIndex: number,
	cursor: { segmentIndex: number },
	label: string,
): string {
	const isBlank = !value || value.replace(/_/g, '') === '';
	const active = segmentIndex === cursor.segmentIndex && state !== 'submit' && state !== 'cancel';

	if (active) return styleText('inverse', isBlank ? label : value.replace(/_/g, ' '));
	if (isBlank) return styleText('dim', label);
	return value.replace(/_/g, styleText('dim', ' '));
}

function renderDate(
	prompt: Omit<InstanceType<typeof DatePrompt>, 'prompt'>,
	state: RenderState
): string {
	const parts = prompt.segmentValues;
	const cursor = prompt.segmentCursor;

	if (state === 'submit' || state === 'cancel') {
		return prompt.formattedValue;
	}

	const sep = styleText('gray', prompt.separator);
	return prompt.segments
		.map((seg, i) => renderSegment(parts[seg.type], i, cursor, DEFAULT_LABELS[seg.type], state))
		.join(sep);
}

export type { DateFormat };

export interface DateOptions extends CommonOptions {
	message: string;
	format?: DateFormat;
	locale?: string;
	defaultValue?: Date;
	initialValue?: Date;
	minDate?: Date;
	maxDate?: Date;
	validate?: (value: Date | undefined) => string | Error | undefined;
}

export const date = (opts: DateOptions) => {
	const validate = opts.validate;
	return new DatePrompt({
		...opts,
		validate(value: Date | undefined) {
			if (value === undefined) {
				if (opts.defaultValue !== undefined) return undefined;
				if (validate) return validate(value);
				return 'Please enter a valid date';
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
