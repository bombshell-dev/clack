import { styleText } from 'node:util';
import { SelectKeyPrompt, settings, wrapTextWithPrefix } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';
import type { Option } from './select.js';

export interface SelectKeyOptions<Value extends string> extends CommonOptions {
	message: string;
	options: Option<Value>[];
	initialValue?: Value;
	caseSensitive?: boolean;
}

export const selectKey = <Value extends string>(opts: SelectKeyOptions<Value>) => {
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
			return `${styleText(['bgCyan', 'gray'], ` ${option.value} `)} ${label}${
				option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
			}`;
		}
		return `${styleText(['gray', 'bgWhite', 'inverse'], ` ${option.value} `)} ${label}${
			option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
		}`;
	};

	return new SelectKeyPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		caseSensitive: opts.caseSensitive,
		render() {
			const hasGuide = opts.withGuide ?? settings.withGuide;
			const title = `${hasGuide ? `${styleText('gray', S_BAR)}\n` : ''}${symbol(this.state)}  ${opts.message}\n`;

			switch (this.state) {
				case 'submit': {
					const submitPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					const selectedOption =
						this.options.find((opt) => opt.value === this.value) ?? opts.options[0];
					const wrapped = wrapTextWithPrefix(
						opts.output,
						opt(selectedOption, 'selected'),
						submitPrefix
					);
					return `${title}${wrapped}`;
				}
				case 'cancel': {
					const cancelPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					const wrapped = wrapTextWithPrefix(
						opts.output,
						opt(this.options[0], 'cancelled'),
						cancelPrefix
					);
					return `${title}${wrapped}${hasGuide ? `\n${styleText('gray', S_BAR)}` : ''}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? styleText('cyan', S_BAR_END) : '';
					const wrapped = this.options
						.map((option, i) =>
							wrapTextWithPrefix(
								opts.output,
								opt(option, i === this.cursor ? 'active' : 'inactive'),
								defaultPrefix
							)
						)
						.join('\n');
					return `${title}${wrapped}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};
