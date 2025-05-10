import { SuggestionPrompt, type ValueWithCursorPart } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

export interface SuggestionOptions extends CommonOptions {
	initialValue?: string;
	message: string;
	validate?: (value: string) => string | Error | undefined;
	suggest?: (value: string) => Array<string>;
}

export const suggestion = (opts: SuggestionOptions) => {
	return new SuggestionPrompt({
		initialValue: opts.initialValue,
		output: opts.output,
		input: opts.input,
		validate: opts.validate,
		suggest: opts.suggest,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const value = this.displayValue.reduce((text: string, line: ValueWithCursorPart) => {
				switch (line.type) {
					case 'value':
						return text + line.text;
					case 'cursor_on_value':
						return text + color.inverse(line.text);
					case 'suggestion':
						return text + color.gray(line.text);
					case 'cursor_on_suggestion':
						return text + color.inverse(color.gray(line.text));
				}
			}, '');

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n${color.yellow(S_BAR)}  ${value}\n${color.yellow(
						S_BAR_END
					)}  ${color.yellow(this.error)}\n`;
				case 'submit':
					return `${title}${color.gray(S_BAR)}  ${color.dim(this.value)}`;
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
