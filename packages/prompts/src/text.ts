import { TextPrompt } from '@clack/core';
import color from 'picocolors';
import { cursor } from "sisteransi";
import { type CommonPromptOptions, S_BAR, S_BAR_END, symbol, clearPrompt } from './common.js';

export interface TextOptions extends CommonPromptOptions {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	initialValue?: string;
	validate?: (value: string | undefined) => string | Error | undefined;
}

export const text = (opts: TextOptions) => {
	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		output: opts.output,
		signal: opts.signal,
		input: opts.input,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const placeholder = opts.placeholder
				? color.inverse(opts.placeholder[0]) + color.dim(opts.placeholder.slice(1))
				: color.inverse(color.hidden('_'));
			const userInput = !this.userInput ? placeholder : this.userInputWithCursor;
			const value = this.value ?? '';

			switch (this.state) {
				case 'error': {
					const errorText = this.error ? `  ${color.yellow(this.error)}` : '';
					return `${title.trim()}\n${color.yellow(S_BAR)}  ${userInput}\n${color.yellow(
						S_BAR_END
					)}${errorText}\n`;
				}
				case 'submit': {
					const valueText = value ? `  ${color.dim(value)}` : '';
					return clearPrompt(opts) ? cursor.up() : `${title}${color.gray(S_BAR)}${valueText}`;
				}
				case 'cancel': {
					const valueText = value ? `  ${color.strikethrough(color.dim(value))}` : '';
					return `${title}${color.gray(S_BAR)}${valueText}${value.trim() ? `\n${color.gray(S_BAR)}` : ''}`;
				}
				default:
					return `${title}${color.cyan(S_BAR)}  ${userInput}\n${color.cyan(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
