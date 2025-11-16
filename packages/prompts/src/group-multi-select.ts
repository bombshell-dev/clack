import { GroupMultiSelectPrompt } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, extendStyle, S_BAR, S_BAR_END } from './common.js';
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
	const style = extendStyle(opts.style);
	const { selectableGroups = true, groupSpacing = 0 } = opts;
	const opt = (
		option: Option<Value> & { group: string | boolean },
		state:
			| 'inactive'
			| 'active'
			| 'selected'
			| 'active-selected'
			| 'group-active'
			| 'group-active-selected'
			| 'submitted'
			| 'cancelled',
		options: (Option<Value> & { group: string | boolean })[] = [],
		prefixBar: string
	) => {
		const label = option.label ?? String(option.value);
		const isItem = typeof option.group === 'string';
		const next = isItem && (options[options.indexOf(option) + 1] ?? { group: true });
		const isLast = isItem && next && next.group === true;
		const prefix = isItem ? (selectableGroups ? `${isLast ? S_BAR_END : S_BAR} ` : '  ') : '';
		let spacingPrefix = '';
		if (groupSpacing > 0 && !isItem) {
			const spacingPrefixText = `\n${prefixBar}`;
			spacingPrefix = `${spacingPrefixText.repeat(groupSpacing - 1)}${spacingPrefixText}  `;
		}

		if (state === 'active') {
			return `${spacingPrefix}${color.dim(prefix)}${style.checkbox.unselected.active} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'group-active') {
			return `${spacingPrefix}${prefix}${style.checkbox.unselected.active} ${color.dim(label)}`;
		}
		if (state === 'group-active-selected') {
			return `${spacingPrefix}${prefix}${style.checkbox.selected.inactive} ${color.dim(label)}`;
		}
		if (state === 'selected') {
			const selectedCheckbox = isItem || selectableGroups ? style.checkbox.selected.inactive : '';
			return `${spacingPrefix}${color.dim(prefix)}${selectedCheckbox} ${color.dim(label)}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		}
		if (state === 'active-selected') {
			return `${spacingPrefix}${color.dim(prefix)}${style.checkbox.selected.active} ${label}${
				option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
			}`;
		}
		if (state === 'submitted') {
			return `${color.dim(label)}`;
		}
		const unselectedCheckbox = isItem || selectableGroups ? style.checkbox.unselected.inactive : '';
		return `${spacingPrefix}${color.dim(prefix)}${unselectedCheckbox} ${color.dim(label)}`;
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
				return `Please select at least one option.\n${color.reset(
					color.dim(
						`Press ${color.gray(color.bgWhite(color.inverse(' space ')))} to select, ${color.gray(
							color.bgWhite(color.inverse(' enter '))
						)} to submit`
					)
				)}`;
		},
		render() {
			const bar = style.formatBar[this.state](S_BAR);
			const _barEnd = style.formatBar[this.state](S_BAR_END);

			const title = `${color.gray(S_BAR)}\n${style.prefix[this.state]}  ${opts.message}\n`;
			const value = this.value ?? [];

			switch (this.state) {
				case 'submit': {
					const selectedOptions = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'submitted'), bar);
					const optionsText =
						selectedOptions.length === 0 ? '' : `  ${selectedOptions.join(color.dim(', '))}`;
					return `${title}${bar}${optionsText}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'), bar)
						.join(color.dim(', '));
					return `${title}${bar}  ${label.trim() ? `${label}\n${bar}` : ''}`;
				}
				case 'error': {
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${color.yellow(S_BAR_END)}  ${color.yellow(ln)}` : `   ${ln}`
						)
						.join('\n');
					return `${title}${bar}  ${this.options
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
								return opt(
									option,
									selected ? 'group-active-selected' : 'group-active',
									options,
									bar
								);
							}
							if (active && selected) {
								return opt(option, 'active-selected', options, bar);
							}
							if (selected) {
								return opt(option, 'selected', options, bar);
							}
							return opt(option, active ? 'active' : 'inactive', options, bar);
						})
						.join(`\n${bar}  `)}\n${footer}\n`;
				}
				default: {
					const optionsText = this.options
						.map((option, i, options) => {
							const selected =
								value.includes(option.value) ||
								(option.group === true && this.isGroupSelected(`${option.value}`));
							const active = i === this.cursor;
							const groupActive =
								!active &&
								typeof option.group === 'string' &&
								this.options[this.cursor].value === option.group;
							let optionText = '';
							if (groupActive) {
								optionText = opt(
									option,
									selected ? 'group-active-selected' : 'group-active',
									options
								);
							} else if (active && selected) {
								optionText = opt(option, 'active-selected', options, bar);
							} else if (selected) {
								optionText = opt(option, 'selected', options, bar);
							} else {
								optionText = opt(option, active ? 'active' : 'inactive', options, bar);
							}
							const prefix = i !== 0 && !optionText.startsWith('\n') ? '  ' : '';
							return `${prefix}${optionText}`;
						})
						.join(`\n${bar}`);
					const optionsPrefix = optionsText.startsWith('\n') ? '' : '  ';
					return `${title}${bar}${optionsPrefix}${optionsText}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
