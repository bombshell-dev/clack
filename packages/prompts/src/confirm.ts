import { ConfirmPrompt, settings } from '@clack/core';
import color from 'picocolors';
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
			const title = `${hasGuide ? `${color.gray(S_BAR)}\n` : ''}${symbol(this.state)}  ${opts.message}\n`;
			const value = this.value ? active : inactive;

			switch (this.state) {
				case 'submit': {
					const submitPrefix = hasGuide ? `${color.gray(S_BAR)}  ` : '';
					return `${title}${submitPrefix}${color.dim(value)}`;
				}
				case 'cancel': {
					const cancelPrefix = hasGuide ? `${color.gray(S_BAR)}  ` : '';
					return `${title}${cancelPrefix}${color.strikethrough(
						color.dim(value)
					)}${hasGuide ? `\n${color.gray(S_BAR)}` : ''}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${color.cyan(S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? color.cyan(S_BAR_END) : '';
					return `${title}${defaultPrefix}${
						this.value
							? `${color.green(S_RADIO_ACTIVE)} ${active}`
							: `${color.dim(S_RADIO_INACTIVE)} ${color.dim(active)}`
					}${opts.vertical ? (hasGuide ? `\n${color.cyan(S_BAR)}  ` : '\n') : ` ${color.dim('/')} `}${
						!this.value
							? `${color.green(S_RADIO_ACTIVE)} ${inactive}`
							: `${color.dim(S_RADIO_INACTIVE)} ${color.dim(inactive)}`
					}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
};
