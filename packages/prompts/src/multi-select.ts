import { MultiSelectPrompt, wrapTextWithPrefix } from '@clack/core';
import color from 'picocolors';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_ACTIVE,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED,
	symbol,
	symbolBar,
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
const computeLabel = (label: string, format: (text: string) => string) => {
	return label
		.split('\n')
		.map((line) => format(line))
		.join('\n');
};

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
			return `${color.gray(S_CHECKBOX_INACTIVE)} ${computeLabel(label, (str) => color.strikethrough(color.gray(str)))}${
				option.hint ? ` ${color.dim(`(${option.hint ?? 'disabled'})`)}` : ''
			}`;
		}
		if (state === 'active') {
			return `${color.cyan(S_CHECKBOX_ACTIVE)} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'selected') {
			return `${color.green(S_CHECKBOX_SELECTED)} ${computeLabel(label, color.dim)}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'cancelled') {
			return `${computeLabel(label, (text) => color.strikethrough(color.dim(text)))}`;
		}
		if (state === 'active-selected') {
			return `${color.green(S_CHECKBOX_SELECTED)} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'submitted') {
			return `${computeLabel(label, color.dim)}`;
		}
		return `${color.dim(S_CHECKBOX_INACTIVE)} ${computeLabel(label, color.dim)}`;
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
			const wrappedMessage = wrapTextWithPrefix(
				opts.output,
				opts.message,
				`${symbolBar(this.state)}  `,
				`${symbol(this.state)}  `
			);
			const title = `${color.gray(S_BAR)}\n${wrappedMessage}\n`;
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
					const submitText =
						this.options
							.filter(({ value: optionValue }) => value.includes(optionValue))
							.map((option) => opt(option, 'submitted'))
							.join(color.dim(', ')) || color.dim('none');
					const wrappedSubmitText = wrapTextWithPrefix(
						opts.output,
						submitText,
						`${color.gray(S_BAR)}  `
					);
					return `${title}${wrappedSubmitText}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'))
						.join(color.dim(', '));
					if (label.trim() === '') {
						return `${title}${color.gray(S_BAR)}`;
					}
					const wrappedLabel = wrapTextWithPrefix(opts.output, label, `${color.gray(S_BAR)}  `);
					return `${title}${wrappedLabel}\n${color.gray(S_BAR)}`;
				}
				case 'error': {
					const prefix = `${color.yellow(S_BAR)}  `;
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${color.yellow(S_BAR_END)}  ${color.yellow(ln)}` : `   ${ln}`
						)
						.join('\n');
					// Calculate rowPadding: title lines + footer lines (error message + trailing newline)
					const titleLineCount = title.split('\n').length;
					const footerLineCount = footer.split('\n').length + 1; // footer + trailing newline
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: styleOption,
					}).join(`\n${prefix}`)}\n${footer}\n`;
				}
				default: {
					const prefix = `${color.cyan(S_BAR)}  `;
					// Calculate rowPadding: title lines + footer lines (S_BAR_END + trailing newline)
					const titleLineCount = title.split('\n').length;
					const footerLineCount = 2; // S_BAR_END + trailing newline
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: styleOption,
					}).join(`\n${prefix}`)}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
