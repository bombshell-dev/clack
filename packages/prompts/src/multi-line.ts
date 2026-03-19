import { styleText } from 'node:util';
import { MultiLinePrompt, wrapTextWithPrefix } from '@clack/core';
import { S_BAR, S_BAR_END, symbol } from './common.js';
import type { TextOptions } from './text.js';

export type MultiLineOptions = TextOptions;

export const multiline = (opts: MultiLineOptions) => {
	return new MultiLinePrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		submitKey: { name: 'd', ctrl: true },
		render() {
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const placeholder = opts.placeholder
				? styleText('inverse', opts.placeholder[0]) + styleText('dim', opts.placeholder.slice(1))
				: styleText(['inverse', 'hidden'], '_');
			const value = `${!this.value ? placeholder : this.valueWithCursor}`;
			switch (this.state) {
				case 'error': {
					const lines = wrapTextWithPrefix(
						opts.output,
						styleText('yellow', value),
						`${styleText('yellow', S_BAR)}  `
					);
					return `${title.trim()}${lines}\n${styleText('yellow', S_BAR_END)}  ${styleText('yellow', this.error)}\n`;
				}
				case 'submit': {
					const lines = wrapTextWithPrefix(
						opts.output,
						styleText('dim', this.value ?? ''),
						`${styleText('gray', S_BAR)}  `
					);
					return `${title}${lines}`;
				}
				case 'cancel': {
					const lines = wrapTextWithPrefix(
						opts.output,
						styleText(['strikethrough', 'dim'], value),
						`${styleText('gray', S_BAR)}  `
					);
					return `${title}${lines}${this.value?.trim() ? `\n${styleText('gray', S_BAR)}` : ''}`;
				}
				default: {
					const lines = wrapTextWithPrefix(opts.output, value, `${styleText('cyan', S_BAR)}  `);
					return `${title}${lines}\n${styleText('cyan', S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<string | symbol>;
};
