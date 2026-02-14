import { styleText } from 'node:util';
import { ConfirmPrompt, settings } from '@clack/core';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE,
	symbol,
} from './common.js';

export interface ConfirmOptions extends CommonOptions {
	message: string;
	active?: string;
	inactive?: string;
	initialValue?: boolean;
	vertical?: boolean;
}
export const confirm = (opts: ConfirmOptions) => {
	const active = opts.active ?? 'Yes';
	const inactive = opts.inactive ?? 'No';
	return new ConfirmPrompt({
		active,
		inactive,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue ?? true,
		render() {
			const hasGuide = opts.withGuide ?? settings.withGuide;
			const title = `${hasGuide ? `${styleText('gray', S_BAR)}\n` : ''}${symbol(this.state)}  ${opts.message}\n`;
			const value = this.value ? active : inactive;

			switch (this.state) {
				case 'submit': {
					const submitPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					return `${title}${submitPrefix}${styleText('dim', value)}`;
				}
				case 'cancel': {
					const cancelPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					return `${title}${cancelPrefix}${styleText(['strikethrough', 'dim'], value)}${
						hasGuide ? `\n${styleText('gray', S_BAR)}` : ''
					}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? styleText('cyan', S_BAR_END) : '';
					return `${title}${defaultPrefix}${
						this.value
							? `${styleText('green', S_RADIO_ACTIVE)} ${active}`
							: `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', active)}`
					}${opts.vertical ? (hasGuide ? `\n${styleText('cyan', S_BAR)}  ` : '\n') : ` ${styleText('dim', '/')} `}${
						!this.value
							? `${styleText('green', S_RADIO_ACTIVE)} ${inactive}`
							: `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', inactive)}`
					}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
};
