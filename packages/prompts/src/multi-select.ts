import { styleText } from 'node:util';
import { MultiSelectPrompt, wrapTextWithPrefix } from '@clack/core';
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
			return `${styleText('gray', S_CHECKBOX_INACTIVE)} ${computeLabel(label, (str) => styleText(['strikethrough', 'gray'], str))}${
				option.hint ? ` ${styleText('dim', `(${option.hint ?? 'disabled'})`)}` : ''
			}`;
		}
		if (state === 'active') {
			return `${styleText('cyan', S_CHECKBOX_ACTIVE)} ${label}${
				option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'selected') {
			return `${styleText('green', S_CHECKBOX_SELECTED)} ${computeLabel(label, (text) => styleText('dim', text))}${
				option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'cancelled') {
			return `${computeLabel(label, (text) => styleText(['strikethrough', 'dim'], text))}`;
		}
		if (state === 'active-selected') {
			return `${styleText('green', S_CHECKBOX_SELECTED)} ${label}${
				option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'submitted') {
			return `${computeLabel(label, (text) => styleText('dim', text))}`;
		}
		return `${styleText('dim', S_CHECKBOX_INACTIVE)} ${computeLabel(label, (text) => styleText('dim', text))}`;
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
						`Press ${styleText(['gray', 'bgWhite', 'inverse'], ' space ')} to select, ${styleText(
							'gray',
							styleText('bgWhite', styleText('inverse', ' enter '))
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
			const title = `${styleText('gray', S_BAR)}\n${wrappedMessage}\n`;
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
							.join(styleText('dim', ', ')) || styleText('dim', 'none');
					const wrappedSubmitText = wrapTextWithPrefix(
						opts.output,
						submitText,
						`${styleText('gray', S_BAR)}  `
					);
					return `${title}${wrappedSubmitText}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'))
						.join(styleText('dim', ', '));
					if (label.trim() === '') {
						return `${title}${styleText('gray', S_BAR)}`;
					}
					const wrappedLabel = wrapTextWithPrefix(
						opts.output,
						label,
						`${styleText('gray', S_BAR)}  `
					);
					return `${title}${wrappedLabel}\n${styleText('gray', S_BAR)}`;
				}
				case 'error': {
					const prefix = `${styleText('yellow', S_BAR)}  `;
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${styleText('yellow', S_BAR_END)}  ${styleText('yellow', ln)}` : `   ${ln}`
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
					const prefix = `${styleText('cyan', S_BAR)}  `;
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
					}).join(`\n${prefix}`)}\n${styleText('cyan', S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
