import { TextPrompt } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

export interface TextOptions extends CommonOptions {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	initialValue?: string;
	validate?: (value: string) => string | Error | undefined;
}

export const text = (opts: TextOptions) => {
	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		output: opts.output,
		input: opts.input,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const placeholder = opts.placeholder
				? color.inverse(opts.placeholder[0]) + color.dim(opts.placeholder.slice(1))
				: color.inverse(color.hidden('_'));
			const value = !this.value ? placeholder : this.valueWithCursor;

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n${color.yellow(S_BAR)}  ${value}\n${color.yellow(
						S_BAR_END
					)}  ${color.yellow(this.error)}\n`;
				case 'submit': {
					const displayValue = this.value === undefined ? '' : this.value;
					return `${title}${color.gray(S_BAR)}  ${color.dim(displayValue)}`;
				}
				case 'cancel':
					return `${title}${color.gray(S_BAR)}  ${color.strikethrough(
						color.dim(this.value ?? '')
					)}${this.value?.trim() ? `\n${color.gray(S_BAR)}` : ''}`;
				default:
					return `${title}${color.cyan(S_BAR)}  ${value}\n${color.cyan(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
