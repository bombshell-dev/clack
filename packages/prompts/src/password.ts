import { PasswordPrompt } from '@clack/core';
import color from 'picocolors';
import {
	type CommonOptions,
	extendStyle,
	getThemeColor,
	getThemePrefix,
	S_BAR,
	S_BAR_END,
	S_PASSWORD_MASK,
} from './common.js';

export interface PasswordOptions extends CommonOptions<{}> {
	message: string;
	mask?: string;
	validate?: (value: string | undefined) => string | Error | undefined;
	clearOnError?: boolean;
}
export const password = (opts: PasswordOptions) => {
	const style = extendStyle<{}>(opts.theme);

	return new PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? S_PASSWORD_MASK,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render() {
			const themeColor = getThemeColor(this.state);
			const themePrefix = getThemePrefix(this.state);

			const bar = style[themeColor](S_BAR);
			const barEnd = style[themeColor](S_BAR_END);

			const title = `${color.gray(S_BAR)}\n${style[themePrefix]}  ${opts.message}\n`;
			const userInput = this.userInputWithCursor;
			const masked = this.masked;

			switch (this.state) {
				case 'error': {
					const maskedText = masked ? `  ${masked}` : '';
					if (opts.clearOnError) {
						this.clear();
					}
					return `${title.trim()}\n${bar}${maskedText}\n${barEnd}  ${style[themeColor](this.error)}\n`;
				}
				case 'submit': {
					const maskedText = masked ? `  ${color.dim(masked)}` : '';
					return `${title}${bar}${maskedText}`;
				}
				case 'cancel': {
					const maskedText = masked ? `  ${color.strikethrough(color.dim(masked))}` : '';
					return `${title}${bar}${maskedText}${masked ? `\n${bar}` : ''}`;
				}
				default:
					return `${title}${bar}  ${userInput}\n${barEnd}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
