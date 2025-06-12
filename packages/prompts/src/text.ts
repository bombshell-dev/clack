import { styleText } from 'node:util';
import { TextPrompt } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

export interface TextOptions extends CommonOptions {
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
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const placeholder = opts.placeholder
				? styleText('inverse', opts.placeholder[0]) + styleText('dim', opts.placeholder.slice(1))
				: styleText('inverse', styleText('hidden', '_'));
			const userInput = !this.userInput ? placeholder : this.userInputWithCursor;
			const value = this.value ?? '';

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n${styleText('yellow', S_BAR)}  ${userInput}\n${styleText(
						'yellow',
						S_BAR_END
					)}  ${styleText('yellow', this.error)}\n`;
				case 'submit': {
					return `${title}${styleText('gray', S_BAR)}  ${styleText('dim', value)}`;
				}
				case 'cancel':
					return `${title}${styleText('gray', S_BAR)}  ${styleText(
						'strikethrough',
						styleText('dim', value)
					)}${value.trim() ? `\n${styleText('gray', S_BAR)}` : ''}`;
				default:
					return `${title}${styleText('cyan', S_BAR)}  ${userInput}\n${styleText('cyan', S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
