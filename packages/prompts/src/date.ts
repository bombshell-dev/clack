import { DatePrompt, settings } from '@clack/core';
import type { DateFormatConfig, DateParts } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

export type DateFormat = 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';

const formatters: Record<DateFormat, (parts: DateParts) => string> = {
	'YYYY/MM/DD': (p) => `${p.year}/${p.month}/${p.day}`,
	'MM/DD/YYYY': (p) => `${p.month}/${p.day}/${p.year}`,
	'DD/MM/YYYY': (p) => `${p.day}/${p.month}/${p.year}`,
};

function buildFormatConfig(format: DateFormat): DateFormatConfig {
	const formatFn = formatters[format];
	const displayTemplate = formatFn({ year: '____', month: '__', day: '__' });
	// Derive segment order from formatter output (e.g. "Y/M/D" → [year, month, day])
	const marker = formatFn({ year: 'Y', month: 'M', day: 'D' });
	const typeMap = { Y: 'year' as const, M: 'month' as const, D: 'day' as const };
	const types = marker.split('/').map((c) => typeMap[c as keyof typeof typeMap]);
	const parts = displayTemplate.split('/');
	let start = 0;
	const segments = parts.map((part, i) => {
		const seg = { type: types[i], start, len: part.length };
		start += part.length + 1;
		return seg;
	});
	return { segments, displayTemplate, format: formatFn };
}

export interface DateOptions extends CommonOptions {
	message: string;
	format?: DateFormat;
	defaultValue?: Date;
	initialValue?: Date;
	validate?: (value: Date | undefined) => string | Error | undefined;
}

export const date = (opts: DateOptions) => {
	const validate = opts.validate;
	const formatConfig = buildFormatConfig(opts.format ?? 'YYYY/MM/DD');
	return new DatePrompt({
		formatConfig,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		validate(value: Date | undefined) {
			if (value === undefined) {
				if (opts.defaultValue !== undefined) return undefined;
				if (validate) return validate(value);
				return 'Please enter a valid date';
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
			const userInput = this.userInputWithCursor;
			const value =
				this.value instanceof Date ? this.value.toISOString().slice(0, 10) : '';

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
					const inlineError =
						(this as { inlineError?: string }).inlineError
							? `\n${inlineErrorBar}${color.yellow((this as { inlineError: string }).inlineError)}`
							: '';
					return `${title}${defaultPrefix}${userInput}${inlineError}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<Date | symbol>;
};
