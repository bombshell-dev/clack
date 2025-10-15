import { styleText } from 'node:util';
import { ConfirmPrompt } from '@clack/core';
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
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const value = this.value ? active : inactive;

			switch (this.state) {
				case 'submit':
					return `${title}${styleText('gray', S_BAR)}  ${styleText('dim', value)}`;
				case 'cancel':
					return `${title}${styleText('gray', S_BAR)}  ${styleText(
						'strikethrough',
						styleText('dim', value)
					)}\n${styleText('gray', S_BAR)}`;
				default: {
					return `${title}${styleText('cyan', S_BAR)}  ${
						this.value
							? `${styleText('green', S_RADIO_ACTIVE)} ${active}`
							: `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', active)}`
					} ${styleText('dim', '/')} ${
						!this.value
							? `${styleText('green', S_RADIO_ACTIVE)} ${inactive}`
							: `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', inactive)}`
					}\n${styleText('cyan', S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
};
