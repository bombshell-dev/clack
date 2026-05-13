import { styleText } from 'node:util';
import { GroupMultiSelectPrompt, settings, wrapTextWithPrefix } from '@clack/core';
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

/**
 * Options for the {@link groupMultiselect} prompt.
 */
export interface GroupMultiSelectOptions<Value> extends CommonOptions {
	/**
	 * The message or question shown to the user above the input.
	 */
	message: string;

	/**
	 * Grouped options to display. Each key is a group label, and each value is an array of options.
	 */
	options: Record<string, Option<Value>[]>;

	/**
	 * The initially selected option(s).
	 */
	initialValues?: Value[];

	/**
	 * The maximum number of items/options to display at once.
	 */
	maxItems?: number;

	/**
	 * When `true` at least one option must be selected.
	 * @default true
	 */
	required?: boolean;

	/**
	 * The value the cursor should be positioned at initially.
	 */
	cursorAt?: Value;

	/**
	 * Whether entire groups can be selected at once.
	 * @default true
	 */
	selectableGroups?: boolean;

	/**
	 * Number of blank lines between groups.
	 * @default 0
	 */
	groupSpacing?: number;
}

/**
 * The `groupMultiselect` prompt extends the {@link multiselect} prompt to allow
 * arranging distinct Multi-Selects, whilst keeping all of them interactive.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#group-multiselect
 *
 * @example
 * ```ts
 * import { groupMultiselect } from '@clack/prompts';
 *
 * const result = await groupMultiselect({
 * 	message: 'Define your project',
 * 	options: {
 * 		'Testing': [
 * 			{ value: 'Jest', hint: 'JavaScript testing framework' },
 * 			{ value: 'Playwright', hint: 'End-to-end testing' },
 * 		],
 * 		'Language': [
 * 			{ value: 'js', label: 'JavaScript', hint: 'Dynamic typing' },
 * 			{ value: 'ts', label: 'TypeScript', hint: 'Static typing' },
 * 		],
 * 	},
 * });
 * ```
 *
 * @param opts The options for the group multiselect prompt
 */
export const groupMultiselect = <Value>(opts: GroupMultiSelectOptions<Value>) => {
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
		options: (Option<Value> & { group: string | boolean })[] = []
	) => {
		const label = option.label ?? String(option.value);
		const isItem = typeof option.group === 'string';
		const next = isItem && (options[options.indexOf(option) + 1] ?? { group: true });
		const isLast = isItem && next && next.group === true;
		let prefix = '';
		let prefixEnd = '';
		if (isItem) {
			if (selectableGroups) {
				prefix = isLast ? `${S_BAR_END} ` : `${S_BAR} `;
				prefixEnd = isLast ? `  ` : `${S_BAR} `;
			} else {
				prefix = '  ';
			}
		}
		let spacingPrefix = '';
		if (groupSpacing > 0 && !isItem) {
			spacingPrefix = '\n'.repeat(groupSpacing);
		}

		if (state === 'active') {
			return wrapTextWithPrefix(
				opts.output,
				`${label}${option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''}`,
				`${spacingPrefix}${styleText('dim', prefix)} `,
				`${spacingPrefix}${styleText('dim', prefix)}${styleText('cyan', S_CHECKBOX_ACTIVE)} `,
				`${spacingPrefix}${styleText('dim', prefixEnd)} `
			);
		}
		if (state === 'group-active') {
			return wrapTextWithPrefix(
				opts.output,
				label,
				`${spacingPrefix}${prefix} `,
				`${spacingPrefix}${prefix}${styleText('cyan', S_CHECKBOX_ACTIVE)} `,
				`${spacingPrefix}${prefixEnd} `,
				(str) => styleText('dim', str)
			);
		}
		if (state === 'group-active-selected') {
			return wrapTextWithPrefix(
				opts.output,
				label,
				`${spacingPrefix}${prefix} `,
				`${spacingPrefix}${prefix}${styleText('green', S_CHECKBOX_SELECTED)} `,
				`${spacingPrefix}${prefixEnd} `,
				(str) => styleText('dim', str)
			);
		}
		if (state === 'selected') {
			const selectedCheckbox =
				isItem || selectableGroups ? styleText('green', S_CHECKBOX_SELECTED) : '';
			return wrapTextWithPrefix(
				opts.output,
				`${label}${option.hint ? ` (${option.hint})` : ''}`,
				`${spacingPrefix}${styleText('dim', prefix)} `,
				`${spacingPrefix}${styleText('dim', prefix)}${selectedCheckbox} `,
				`${spacingPrefix}${styleText('dim', prefixEnd)} `,
				(str) => styleText('dim', str)
			);
		}
		if (state === 'cancelled') {
			return `${styleText(['strikethrough', 'dim'], label)}`;
		}
		if (state === 'active-selected') {
			return wrapTextWithPrefix(
				opts.output,
				`${label}${option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''}`,
				`${spacingPrefix}${styleText('dim', prefix)} `,
				`${spacingPrefix}${styleText('dim', prefix)}${styleText('green', S_CHECKBOX_SELECTED)} `,
				`${spacingPrefix}${styleText('dim', prefixEnd)} `
			);
		}
		if (state === 'submitted') {
			return `${styleText('dim', label)}`;
		}
		const unselectedCheckbox =
			isItem || selectableGroups ? styleText('dim', S_CHECKBOX_INACTIVE) : '';
		return wrapTextWithPrefix(
			opts.output,
			label,
			`${spacingPrefix}${styleText('dim', prefix)} `,
			`${spacingPrefix}${styleText('dim', prefix)}${unselectedCheckbox} `,
			`${spacingPrefix}${styleText('dim', prefixEnd)} `,
			(str) => styleText('dim', str)
		);
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
						`Press ${styleText(['gray', 'bgWhite', 'inverse'], ' space ')} to select, ${styleText(
							'gray',
							styleText(['bgWhite', 'inverse'], ' enter ')
						)} to submit`
					)
				)}`;
		},
		render() {
			const hasGuide = opts.withGuide ?? settings.withGuide;
			const title = `${hasGuide ? `${styleText('gray', S_BAR)}\n` : ''}${symbol(this.state)}  ${opts.message}\n`;
			const value = this.value ?? [];

			const styleOption = (
				option: Option<Value> & { group: string | boolean },
				active: boolean
			) => {
				const options = this.options;
				const selected =
					value.includes(option.value) ||
					(option.group === true && this.isGroupSelected(`${option.value}`));
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
			};

			switch (this.state) {
				case 'submit': {
					const selectedOptions = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'submitted'));
					const optionsText =
						selectedOptions.length === 0 ? '' : `  ${selectedOptions.join(styleText('dim', ', '))}`;
					return `${title}${hasGuide ? styleText('gray', S_BAR) : ''}${optionsText}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value: optionValue }) => value.includes(optionValue))
						.map((option) => opt(option, 'cancelled'))
						.join(styleText('dim', ', '));
					return `${title}${hasGuide ? `${styleText('gray', S_BAR)}  ` : ''}${
						label.trim() ? `${label}${hasGuide ? `\n${styleText('gray', S_BAR)}` : ''}` : ''
					}`;
				}
				case 'error': {
					const guidePrefix = hasGuide ? `${styleText('yellow', S_BAR)}  ` : '';
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0
								? `${hasGuide ? `${styleText('yellow', S_BAR_END)}  ` : ''}${styleText('yellow', ln)}`
								: `   ${ln}`
						)
						.join('\n');
					// Calculate rowPadding: title lines + footer lines (error message + trailing newline)
					const titleLineCount = title.split('\n').length;
					const footerLineCount = footer.split('\n').length + 1; // footer + trailing newline
					const optionsText = limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: guidePrefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: styleOption,
					}).join(`\n${guidePrefix}`);
					return `${title}${guidePrefix}${optionsText}\n${footer}\n`;
				}
				default: {
					const guidePrefix = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					// Calculate rowPadding: title lines + footer lines (S_BAR_END + trailing newline)
					const titleLineCount = title.split('\n').length;
					const footerLineCount = (hasGuide ? 1 : 0) + 1; // guide line + trailing newline
					const optionsText = limitOptions({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: guidePrefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: styleOption,
					}).join(`\n${guidePrefix}`);
					return `${title}${guidePrefix}${optionsText}\n${
						hasGuide ? styleText('cyan', S_BAR_END) : ''
					}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};
