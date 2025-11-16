import { ConfirmPrompt } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, extendStyle, S_BAR, S_BAR_END } from './common.js';

export interface ConfirmOptions extends CommonOptions {
	message: string;
	active?: string;
	inactive?: string;
	initialValue?: boolean;
}
export const confirm = (opts: ConfirmOptions) => {
	const style = extendStyle(opts.theme);
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
			const bar = style.formatBar[this.state](S_BAR);
			const barEnd = style.formatBar[this.state](S_BAR_END);

			const title = `${color.gray(S_BAR)}\n${style.prefix[this.state]}  ${opts.message}\n`;
			const value = this.value ? active : inactive;

			switch (this.state) {
				case 'submit':
					return `${title}${bar}  ${color.dim(value)}`;
				case 'cancel':
					return `${title}${bar}  ${color.strikethrough(color.dim(value))}\n${bar}`;
				default: {
					return `${title}${bar}  ${
						this.value
							? `${style.radio.active} ${active}`
							: `${style.radio.inactive} ${color.dim(active)}`
					} ${color.dim('/')} ${
						!this.value
							? `${style.radio.active} ${inactive}`
							: `${style.radio.inactive} ${color.dim(inactive)}`
					}\n${barEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
};
