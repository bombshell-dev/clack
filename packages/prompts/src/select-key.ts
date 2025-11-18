import { SelectKeyPrompt } from '@clack/core';
import color from 'picocolors';
import { extendStyle, S_BAR, S_BAR_END } from './common.js';
import type { Option, SelectOptions } from './select.js';

export const selectKey = <Value extends string>(opts: SelectOptions<Value>) => {
	const style = extendStyle<{}>(opts.theme);
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' = 'inactive'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'selected') {
			return `${color.dim(label)}`;
		}
		if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		}
		if (state === 'active') {
			return `${color.bgCyan(color.gray(` ${option.value} `))} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		}
		return `${color.gray(color.bgWhite(color.inverse(` ${option.value} `)))} ${label} ${
			option.hint ? color.dim(`(${option.hint})`) : ''
		}`;
	};

	return new SelectKeyPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		render() {
			const title = `${color.gray(S_BAR)}\n${style.prefix[this.state]}  ${opts.message}\n`;
			const bar = style.formatBar[this.state](S_BAR);

			switch (this.state) {
				case 'submit':
					return `${title}${bar}  ${opt(
						this.options.find((opt) => opt.value === this.value) ?? opts.options[0],
						'selected'
					)}`;
				case 'cancel':
					return `${title}${bar}  ${opt(this.options[0], 'cancelled')}\n${bar}`;
				default: {
					return `${title}${bar}  ${this.options
						.map((option, i) => opt(option, i === this.cursor ? 'active' : 'inactive'))
						.join(`\n${bar}  `)}\n${style.formatBar[this.state](S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};
