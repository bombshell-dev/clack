import { MultiSelectPrompt, wrapTextWithPrefix } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, type CheckboxTheme, getThemeColor, getThemePrefix, extendStyle, S_BAR, S_BAR_END } from './common.js';
import { limitOptions } from './limit-options.js';
import type { Option } from './select.js';

export interface MultiSelectOptions<Value> extends CommonOptions<CheckboxTheme> {
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
	const style = extendStyle<CheckboxTheme>(opts.theme);
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
			return `${style.checkboxDisabled} ${computeLabel(label, color.gray)}${
				option.hint ? ` ${color.dim(`(${option.hint ?? 'disabled'})`)}` : ''
			}`;
		}
		if (state === 'active') {
			return `${style.checkboxUnselectedActive} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'selected') {
			return `${style.checkboxSelectedInactive} ${computeLabel(label, color.dim)}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'cancelled') {
			return `${computeLabel(label, (text) => color.strikethrough(color.dim(text)))}`;
		}
		if (state === 'active-selected') {
			return `${style.checkboxSelectedActive} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'submitted') {
			return `${computeLabel(label, color.dim)}`;
		}
		return `${style.checkboxUnselectedInactive} ${computeLabel(label, color.dim)}`;
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
			const themeColor = getThemeColor(this.state);
			const themePrefix = getThemePrefix(this.state);

			const bar = style[themeColor](S_BAR);
			const barEnd = style[themeColor](S_BAR_END);
			const wrappedMessage = wrapTextWithPrefix(
				opts.output,
				opts.message,
				`${bar}  `,
				`${style[themePrefix]}  `
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
					const wrappedSubmitText = wrapTextWithPrefix(opts.output, submitText, `${bar}  `);
					return `${title}${wrappedSubmitText}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'))
						.join(color.dim(', '));
					if (label.trim() === '') {
						return `${title}${bar}`;
					}
					const wrappedLabel = wrapTextWithPrefix(opts.output, label, `${bar}  `);
					return `${title}${wrappedLabel}\n${bar}`;
				}
				case 'error': {
					const prefix = `${bar}  `;
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${barEnd}  ${style[themeColor](ln)}` : `   ${ln}`
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
					const prefix = `${bar}  `;
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						style: styleOption,
					}).join(`\n${prefix}`)}\n${barEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
