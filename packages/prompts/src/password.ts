import { PasswordPrompt } from '@clack/core';
import color from 'picocolors';
import { cursor } from "sisteransi";
import { type CommonPromptOptions, S_BAR, S_BAR_END, S_PASSWORD_MASK, symbol, clearPrompt } from './common.js';

export interface PasswordOptions extends CommonPromptOptions {
	message: string;
	mask?: string;
	validate?: (value: string | undefined) => string | Error | undefined;
	clearOnError?: boolean;
}
export const password = (opts: PasswordOptions) => {
	return new PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? S_PASSWORD_MASK,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const userInput = this.userInputWithCursor;
			const masked = this.masked;

			switch (this.state) {
				case 'error': {
					const maskedText = masked ? `  ${masked}` : '';
					if (opts.clearOnError) {
						this.clear();
					}
					return `${title.trim()}\n${color.yellow(S_BAR)}${maskedText}\n${color.yellow(
						S_BAR_END
					)}  ${color.yellow(this.error)}\n`;
				}
				case 'submit': {
					const maskedText = masked ? `  ${color.dim(masked)}` : '';
					return clearPrompt(opts) ? cursor.up() : `${title}${color.gray(S_BAR)}${maskedText}`;
				}
				case 'cancel': {
					const maskedText = masked ? `  ${color.strikethrough(color.dim(masked))}` : '';
					return `${title}${color.gray(S_BAR)}${maskedText}${
						masked ? `\n${color.gray(S_BAR)}` : ''
					}`;
				}
				default:
					return `${title}${color.cyan(S_BAR)}  ${userInput}\n${color.cyan(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
