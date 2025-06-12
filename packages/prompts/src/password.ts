import { styleText } from 'node:util';
import { PasswordPrompt } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, S_PASSWORD_MASK, symbol } from './common.js';

export interface PasswordOptions extends CommonOptions {
	message: string;
	mask?: string;
	validate?: (value: string | undefined) => string | Error | undefined;
}
export const password = (opts: PasswordOptions) => {
	return new PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? S_PASSWORD_MASK,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render() {
			// const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const userInput = this.userInputWithCursor;
			const masked = this.masked;

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n${styleText('yellow', S_BAR)}  ${masked}\n${styleText(
						'yellow',
						S_BAR_END
					)}  ${styleText('yellow', this.error)}\n`;
				case 'submit':
					return `${title}${styleText('gray', S_BAR)}  ${styleText('dim', masked)}`;
				case 'cancel':
					return `${title}${styleText('gray', S_BAR)}  ${styleText('strikethrough', styleText('dim', masked))}${
						masked ? `\n${styleText('gray', S_BAR)}` : ''
					}`;
				default:
					return `${title}${styleText('cyan', S_BAR)}  ${userInput}\n${styleText('cyan', S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
