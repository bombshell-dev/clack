import { styleText } from 'node:util';
import { MultiSelectPrompt } from '@clack/core';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_ACTIVE,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED,
	symbol,
} from './common.js';
import { limitOptions } from './limit-options.js';
import type { Option } from './select.js';

export interface MultiSelectOptions<Value> extends CommonOptions {
	message: string;
	options: Option<Value>[];
	initialValues?: Value[];
	maxItems?: number;
	required?: boolean;
	cursorAt?: Value;
}
export const multiselect = <Value>(opts: MultiSelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'active-selected' | 'submitted' | 'cancelled'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'active') {
			return `${styleText('cyan', S_CHECKBOX_ACTIVE)} ${label}${
				option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'selected') {
			return `${styleText('green', S_CHECKBOX_SELECTED)} ${styleText('dim', label)}${
				option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'cancelled') {
			return `${styleText('strikethrough', styleText('dim', label))}`;
		}
		if (state === 'active-selected') {
			return `${styleText('green', S_CHECKBOX_SELECTED)} ${label}${
				option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'submitted') {
			return `${styleText('dim', label)}`;
		}
		return `${styleText('dim', S_CHECKBOX_INACTIVE)} ${styleText('dim', label)}`;
	};
	const required = opts.required ?? true;

	return new MultiSelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValues: opts.initialValues,
		required,
		cursorAt: opts.cursorAt,
		validate(selected: Value[] | undefined) {
			if (required && (selected === undefined || selected.length === 0))
				return `Please select at least one option.\n${styleText(
					'reset',
					styleText(
						'dim',
						`Press ${styleText('gray', styleText('bgWhite', styleText('inverse', ' space ')))} to select, ${styleText(
							'gray',
							styleText('bgWhite', styleText('inverse', ' enter '))
						)} to submit`
					)
				)}`;
		},
		render() {
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const value = this.value ?? [];

			const styleOption = (option: Option<Value>, active: boolean) => {
				const selected = value.includes(option.value);
				if (active && selected) {
					return opt(option, 'active-selected');
				}
				if (selected) {
					return opt(option, 'selected');
				}
				return opt(option, active ? 'active' : 'inactive');
			};

			switch (this.state) {
				case 'submit': {
					return `${title}${styleText('gray', S_BAR)}  ${
						this.options
							.filter(({ value: optionValue }) => value.includes(optionValue))
							.map((option) => opt(option, 'submitted'))
							.join(styleText('dim', ', ')) || styleText('dim', 'none')
					}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'))
						.join(styleText('dim', ', '));
					return `${title}${styleText('gray', S_BAR)}${
						label.trim() ? `  ${label}\n${styleText('gray', S_BAR)}` : ''
					}`;
				}
				case 'error': {
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${styleText('yellow', S_BAR_END)}  ${styleText('yellow', ln)}` : `   ${ln}`
						)
						.join('\n');
					return `${title + styleText('yellow', S_BAR)}  ${limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						style: styleOption,
					}).join(`\n${styleText('yellow', S_BAR)}  `)}\n${footer}\n`;
				}
				default: {
					return `${title}${styleText('cyan', S_BAR)}  ${limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						style: styleOption,
					}).join(`\n${styleText('cyan', S_BAR)}  `)}\n${styleText('cyan', S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
