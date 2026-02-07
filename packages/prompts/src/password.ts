import { PasswordPrompt, settings } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, S_BAR, S_BAR_END, S_PASSWORD_MASK, symbol } from './common.js';

export interface PasswordOptions extends CommonOptions {
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
			const hasGuide = opts.withGuide ?? settings.withGuide;
			const title = `${hasGuide ? `${color.gray(S_BAR)}\n` : ''}${symbol(this.state)}  ${opts.message}\n`;
			const userInput = this.userInputWithCursor;
			const masked = this.masked;

			switch (this.state) {
				case 'error': {
					const errorPrefix = hasGuide ? `${color.yellow(S_BAR)}  ` : '';
					const errorPrefixEnd = hasGuide ? `${color.yellow(S_BAR_END)}  ` : '';
					const maskedText = masked ?? '';
					if (opts.clearOnError) {
						this.clear();
					}
					return `${title.trim()}\n${errorPrefix}${maskedText}\n${errorPrefixEnd}${color.yellow(this.error)}\n`;
				}
				case 'submit': {
					const submitPrefix = hasGuide ? `${color.gray(S_BAR)}  ` : '';
					const maskedText = masked ? color.dim(masked) : '';
					return `${title}${submitPrefix}${maskedText}`;
				}
				case 'cancel': {
					const cancelPrefix = hasGuide ? `${color.gray(S_BAR)}  ` : '';
					const maskedText = masked ? color.strikethrough(color.dim(masked)) : '';
					return `${title}${cancelPrefix}${maskedText}${
						masked && hasGuide ? `\n${color.gray(S_BAR)}` : ''
					}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${color.cyan(S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? color.cyan(S_BAR_END) : '';
					return `${title}${defaultPrefix}${userInput}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<string | symbol>;
};
