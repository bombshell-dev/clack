import { styleText } from 'node:util';
import { SelectKeyPrompt } from '@clack/core';
import { S_BAR, S_BAR_END, symbol } from './common.js';
import type { Option, SelectOptions } from './select.js';

export const selectKey = <Value extends string>(opts: SelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' = 'inactive'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'selected') {
			return `${styleText('dim', label)}`;
		}
		if (state === 'cancelled') {
			return `${styleText(['strikethrough', 'dim'], label)}`;
		}
		if (state === 'active') {
			return `${styleText(['bgCyan', 'gray'], ` ${option.value} `)} ${label} ${
				option.hint ? styleText('dim', `(${option.hint})`) : ''
			}`;
		}
		return `${styleText(['gray', 'bgWhite', 'inverse'], ` ${option.value} `)} ${label} ${
			option.hint ? styleText('dim', `(${option.hint})`) : ''
		}`;
	};

	return new SelectKeyPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		render() {
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			switch (this.state) {
				case 'submit':
					return `${title}${styleText('gray', S_BAR)}  ${opt(
						this.options.find((opt) => opt.value === this.value) ?? opts.options[0],
						'selected'
					)}`;
				case 'cancel':
					return `${title}${styleText('gray', S_BAR)}  ${opt(this.options[0], 'cancelled')}\n${styleText(
						'gray',
						S_BAR
					)}`;
				default: {
					return `${title}${styleText('cyan', S_BAR)}  ${this.options
						.map((option, i) => opt(option, i === this.cursor ? 'active' : 'inactive'))
						.join(`\n${styleText('cyan', S_BAR)}  `)}\n${styleText('cyan', S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};
