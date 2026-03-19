import { styleText } from 'node:util';
import { MultiLinePrompt } from '@clack/core';
import { S_BAR, S_BAR_END, symbol } from './common.js';
import type { TextOptions } from './text.js';

export type MultiLineOptions = TextOptions;

export const multiline = (opts: MultiLineOptions) => {
	function wrap(
		text: string,
		barStyle: (v: string) => string,
		textStyle: (v: string) => string
	): string {
		return `${barStyle(S_BAR)}  ${text
			.split('\n')
			.map(textStyle)
			.join(`\n${barStyle(S_BAR)}  `)}`;
	}
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
				case 'error':
					return `${title.trim()}${wrap(
						value,
						(str) => styleText('yellow', str),
						(str) => styleText('yellow', str)
					)}\n${styleText('yellow', S_BAR_END)}  ${styleText('yellow', this.error)}\n`;
				case 'submit':
					return `${title}${wrap(
						this.value || opts.placeholder || '',
						(str) => styleText('gray', str),
						(str) => styleText('dim', str)
					)}`;
				case 'cancel':
					return `${title}${wrap(
						this.value ?? '',
						(str) => styleText('gray', str),
						(v) => styleText(['strikethrough', 'dim'], v)
					)}${this.value?.trim() ? `\n${styleText('gray', S_BAR)}` : ''}`;
				default:
					return `${title}${wrap(
						value,
						(str) => styleText('cyan', str),
						(v) => v
					)}\n${styleText('cyan', S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};
