import { styleText } from 'node:util';
import { GroupMultiSelectPrompt } from '@clack/core';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_ACTIVE,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED,
	symbol,
} from './common.js';
import type { Option } from './select.js';

export interface GroupMultiSelectOptions<Value> extends CommonOptions {
	message: string;
	options: Record<string, Option<Value>[]>;
	initialValues?: Value[];
	required?: boolean;
	cursorAt?: Value;
	selectableGroups?: boolean;
	groupSpacing?: number;
}
export const groupMultiselect = <Value>(opts: GroupMultiSelectOptions<Value>) => {
	const { selectableGroups = true, groupSpacing = 0 } = opts;
	const opt = (
		option: Option<Value>,
		state:
			| 'inactive'
			| 'active'
			| 'selected'
			| 'active-selected'
			| 'group-active'
			| 'group-active-selected'
			| 'submitted'
			| 'cancelled',
		options: Option<Value>[] = []
	) => {
		const label = option.label ?? String(option.value);
		const isItem = typeof (option as any).group === 'string';
		const next = isItem && (options[options.indexOf(option) + 1] ?? { group: true });
		const isLast = isItem && (next as any).group === true;
		const prefix = isItem ? (selectableGroups ? `${isLast ? S_BAR_END : S_BAR} ` : '  ') : '';
		const spacingPrefix =
			// groupSpacing > 0 && !isItem ? `\n${color.cyan(S_BAR)}  `.repeat(groupSpacing) : '';
			groupSpacing > 0 && !isItem ? `\n${styleText('cyan', S_BAR)}  `.repeat(groupSpacing) : '';

		if (state === 'active') {
			return `${spacingPrefix}${styleText('dim', prefix)}${styleText('cyan', S_CHECKBOX_ACTIVE)} ${label} ${
				option.hint ? styleText('dim', `(${option.hint})`) : ''
			}`;
		}
		if (state === 'group-active') {
			return `${spacingPrefix}${styleText('dim', prefix)}${styleText('cyan', S_CHECKBOX_ACTIVE)} ${styleText('dim', label)}`;
		}
		if (state === 'group-active-selected') {
			return `${spacingPrefix}${styleText('dim', prefix)}${styleText('green', S_CHECKBOX_SELECTED)} ${styleText('dim', label)}`;
		}
		if (state === 'selected') {
			const selectedCheckbox =
				isItem || selectableGroups ? styleText('green', S_CHECKBOX_SELECTED) : '';
			return `${spacingPrefix}${styleText('dim', prefix)}${selectedCheckbox} ${styleText('dim', label)} ${
				option.hint ? styleText('dim', `(${option.hint})`) : ''
			}`;
		}
		if (state === 'cancelled') {
			return `${styleText('strikethrough', styleText('dim', label))}`;
		}
		if (state === 'active-selected') {
			return `${spacingPrefix}${styleText('dim', prefix)}${styleText('green', S_CHECKBOX_SELECTED)} ${label} ${
				option.hint ? styleText('dim', `(${option.hint})`) : ''
			}`;
		}
		if (state === 'submitted') {
			return `${styleText('dim', label)}`;
		}
		const unselectedCheckbox =
			isItem || selectableGroups ? styleText('dim', S_CHECKBOX_INACTIVE) : '';
		return `${spacingPrefix}${styleText('dim', prefix)}${unselectedCheckbox} ${styleText('dim', label)}`;
	};
	const required = opts.required ?? true;

	return new GroupMultiSelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValues: opts.initialValues,
		required,
		cursorAt: opts.cursorAt,
		selectableGroups,
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

			switch (this.state) {
				case 'submit': {
					return `${title}${styleText('gray', S_BAR)}  ${this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'submitted'))
						.join(styleText('dim', ', '))}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'))
						.join(styleText('dim', ', '));
					return `${title}${styleText('gray', S_BAR)}  ${
						label.trim() ? `${label}\n${styleText('gray', S_BAR)}` : ''
					}`;
				}
				case 'error': {
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${styleText('yellow', S_BAR_END)}  ${styleText('yellow', ln)}` : `   ${ln}`
						)
						.join('\n');
					return `${title}${styleText('yellow', S_BAR)}  ${this.options
						.map((option, i, options) => {
							const selected =
								value.includes(option.value) ||
								(option.group === true && this.isGroupSelected(`${option.value}`));
							const active = i === this.cursor;
							const groupActive =
								!active &&
								typeof option.group === 'string' &&
								this.options[this.cursor].value === option.group;
							if (groupActive) {
								return opt(option, selected ? 'group-active-selected' : 'group-active', options);
							}
							if (active && selected) {
								return opt(option, 'active-selected', options);
							}
							if (selected) {
								return opt(option, 'selected', options);
							}
							return opt(option, active ? 'active' : 'inactive', options);
						})
						.join(`\n${styleText('yellow', S_BAR)}  `)}\n${footer}\n`;
				}
				default: {
					return `${title}${styleText('cyan', S_BAR)}  ${this.options
						.map((option, i, options) => {
							const selected =
								value.includes(option.value) ||
								(option.group === true && this.isGroupSelected(`${option.value}`));
							const active = i === this.cursor;
							const groupActive =
								!active &&
								typeof option.group === 'string' &&
								this.options[this.cursor].value === option.group;
							if (groupActive) {
								return opt(option, selected ? 'group-active-selected' : 'group-active', options);
							}
							if (active && selected) {
								return opt(option, 'active-selected', options);
							}
							if (selected) {
								return opt(option, 'selected', options);
							}
							return opt(option, active ? 'active' : 'inactive', options);
						})
						.join(`\n${styleText('cyan', S_BAR)}  `)}\n${styleText('cyan', S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
