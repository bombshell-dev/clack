import { ConfirmPrompt } from '@clack/core';
import color from 'picocolors';
import {
	type CommonOptions,
	extendStyle,
	getThemeColor,
	getThemePrefix,
	type RadioTheme,
	S_BAR,
	S_BAR_END,
} from './common.js';

export interface ConfirmOptions extends CommonOptions<RadioTheme> {
	message: string;
	active?: string;
	inactive?: string;
	initialValue?: boolean;
}
export const confirm = (opts: ConfirmOptions) => {
	const style = extendStyle<RadioTheme>(opts.theme);
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
			const themeColor = getThemeColor(this.state);
			const themePrefix = getThemePrefix(this.state);

			const bar = style[themeColor](S_BAR);
			const barEnd = style[themeColor](S_BAR_END);

			const title = `${color.gray(S_BAR)}\n${style[themePrefix]}  ${opts.message}\n`;
			const value = this.value ? active : inactive;

			switch (this.state) {
				case 'submit':
					return `${title}${bar}  ${color.dim(value)}`;
				case 'cancel':
					return `${title}${bar}  ${color.strikethrough(color.dim(value))}\n${bar}`;
				default: {
					return `${title}${bar}  ${
						this.value
							? `${style.radioActive} ${active}`
							: `${style.radioInactive} ${color.dim(active)}`
					} ${color.dim('/')} ${
						!this.value
							? `${style.radioActive} ${inactive}`
							: `${style.radioInactive} ${color.dim(inactive)}`
					}\n${barEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
};
