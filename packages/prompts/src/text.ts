import { TextPrompt } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, extendStyle, S_BAR, S_BAR_END } from './common.js';

export interface TextOptions extends CommonOptions<{}> {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	initialValue?: string;
	validate?: (value: string | undefined) => string | Error | undefined;
}

export const text = (opts: TextOptions) => {
	const style = extendStyle<{}>(opts.theme);

	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		output: opts.output,
		signal: opts.signal,
		input: opts.input,
		render() {
			const bar = style.formatBar[this.state](S_BAR);
			const barEnd = style.formatBar[this.state](S_BAR_END);

			const title = `${color.gray(S_BAR)}\n${style.prefix[this.state]}  ${opts.message}\n`;
			const placeholder = opts.placeholder
				? color.inverse(opts.placeholder[0]) + color.dim(opts.placeholder.slice(1))
				: color.inverse(color.hidden('_'));
			const userInput = !this.userInput ? placeholder : this.userInputWithCursor;
			const value = this.value ?? '';

			switch (this.state) {
				case 'error': {
					const errorText = this.error ? `  ${style.formatBar[this.state](this.error)}` : '';
					return `${title.trim()}\n${bar}  ${userInput}\n${barEnd}${errorText}\n`;
				}
				case 'submit': {
					const valueText = value ? `  ${color.dim(value)}` : '';
					return `${title}${bar}${valueText}`;
				}
				case 'cancel': {
					const valueText = value ? `  ${color.strikethrough(color.dim(value))}` : '';
					return `${title}${bar}${valueText}${value.trim() ? `\n${bar}` : ''}`;
				}
				default:
					return `${title}${bar}  ${userInput}\n${barEnd}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
