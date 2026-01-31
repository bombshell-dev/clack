import { DatePrompt, settings } from '@clack/core';
import type { DateFormat } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

export interface DateOptions extends CommonOptions {
	message: string;
	format?: DateFormat;
	defaultValue?: string | Date;
	initialValue?: string | Date;
	validate?: (value: string | undefined) => string | Error | undefined;
}

export const date = (opts: DateOptions) => {
	const validate = opts.validate;
	return new DatePrompt({
		format: opts.format ?? 'YYYY/MM/DD',
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		validate(value) {
			if (value === undefined || value === '') {
				if (opts.defaultValue !== undefined) {
					return undefined;
				}
				if (validate) {
					return validate(value);
				}
				return 'Please enter a valid date';
			}
			if (validate) {
				return validate(value);
			}
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
			const value = this.value ?? '';

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
	}).prompt() as Promise<string | symbol>;
};
