import { MultiSelectPrompt } from '@clack/core';
import color from 'picocolors';
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
		state:
			| 'inactive'
			| 'active'
			| 'selected'
			| 'active-selected'
			| 'submitted'
			| 'cancelled'
			| 'disabled'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'disabled') {
			return `${color.gray(S_CHECKBOX_INACTIVE)} ${color.gray(label)}${
				option.hint ? ` ${color.dim(`(${option.hint ?? 'disabled'})`)}` : ''
			}`;
		}
		if (state === 'active') {
			return `${color.cyan(S_CHECKBOX_ACTIVE)} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'selected') {
			return `${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		}
		if (state === 'active-selected') {
			return `${color.green(S_CHECKBOX_SELECTED)} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'submitted') {
			return `${color.dim(label)}`;
		}
		return `${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`;
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
				return `Please select at least one option.\n${color.reset(
					color.dim(
						`Press ${color.gray(color.bgWhite(color.inverse(' space ')))} to select, ${color.gray(
							color.bgWhite(color.inverse(' enter '))
						)} to submit`
					)
				)}`;
		},
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const value = this.value ?? [];

			const styleOption = (option: Option<Value>, active: boolean) => {
				if (option.disabled) {
					return opt(option, 'disabled');
				}
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
					return `${title}${color.gray(S_BAR)}  ${
						this.options
							.filter(({ value: optionValue }) => value.includes(optionValue))
							.map((option) => opt(option, 'submitted'))
							.join(color.dim(', ')) || color.dim('none')
					}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'))
						.join(color.dim(', '));
					return `${title}${color.gray(S_BAR)}${
						label.trim() ? `  ${label}\n${color.gray(S_BAR)}` : ''
					}`;
				}
				case 'error': {
					const prefix = `${color.yellow(S_BAR)}  `;
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${color.yellow(S_BAR_END)}  ${color.yellow(ln)}` : `   ${ln}`
						)
						.join('\n');
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						style: styleOption,
					}).join(`\n${prefix}`)}\n${footer}\n`;
				}
				default: {
					const prefix = `${color.cyan(S_BAR)}  `;
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						style: styleOption,
					}).join(`\n${prefix}`)}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
