import { styleText } from 'node:util';
import { MultiLinePrompt, wrapTextWithPrefix } from '@clack/core';
import { S_BAR, S_BAR_END, symbol } from './common.js';
import type { TextOptions } from './text.js';

export interface MultiLineOptions extends TextOptions {
	showSubmit?: boolean;
}

export const multiline = (opts: MultiLineOptions) => {
	return new MultiLinePrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		showSubmit: opts.showSubmit,
		render() {
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const placeholder = opts.placeholder
				? styleText('inverse', opts.placeholder[0]) + styleText('dim', opts.placeholder.slice(1))
				: styleText(['inverse', 'hidden'], '_');
			const userInput = !this.userInput ? placeholder : this.userInputWithCursor;
			const submitButton = opts.showSubmit
				? `\n   ${styleText(this.focused === 'submit' ? 'cyan' : 'dim', '[ submit ]')}`
				: '';
			switch (this.state) {
				case 'error': {
					const lines = wrapTextWithPrefix(
						opts.output,
						userInput,
						`${styleText('yellow', S_BAR)}  `,
						undefined
					);
					return `${title}${lines}\n${styleText('yellow', S_BAR_END)}  ${styleText('yellow', this.error)}${submitButton}\n`;
				}
				case 'submit': {
					const lines = wrapTextWithPrefix(
						opts.output,
						this.value ?? '',
						`${styleText('gray', S_BAR)}  `,
						undefined,
						(str) => styleText('dim', str)
					);
					return `${title}${lines}`;
				}
				case 'cancel': {
					const lines = wrapTextWithPrefix(
						opts.output,
						userInput,
						`${styleText('gray', S_BAR)}  `,
						undefined,
						(str) => styleText(['strikethrough', 'dim'], str)
					);
					return `${title}${lines}${this.value?.trim() ? `\n${styleText('gray', S_BAR)}` : ''}`;
				}
				default: {
					const lines = wrapTextWithPrefix(opts.output, userInput, `${styleText('cyan', S_BAR)}  `);
					return `${title}${lines}\n${styleText('cyan', S_BAR_END)}${submitButton}\n`;
				}
			}
		},
	}).prompt() as Promise<string | symbol>;
};
