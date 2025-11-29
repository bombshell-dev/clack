import { SelectPrompt, wrapTextWithPrefix } from '@clack/core';
import color from 'picocolors';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE,
	symbol,
	symbolBar,
} from './common.js';
import { limitOptions } from './limit-options.js';

type Primitive = Readonly<string | boolean | number>;

export type Option<Value> = Value extends Primitive
	? {
			/**
			 * Internal data for this option.
			 */
			value: Value;
			/**
			 * The optional, user-facing text for this option.
			 *
			 * By default, the `value` is converted to a string.
			 */
			label?: string;
			/**
			 * An optional hint to display to the user when
			 * this option might be selected.
			 *
			 * By default, no `hint` is displayed.
			 */
			hint?: string;
			/**
			 * Whether this option is disabled.
			 * Disabled options are visible but cannot be selected.
			 *
			 * By default, options are not disabled.
			 */
			disabled?: boolean;
		}
	: {
			/**
			 * Internal data for this option.
			 */
			value: Value;
			/**
			 * Required. The user-facing text for this option.
			 */
			label: string;
			/**
			 * An optional hint to display to the user when
			 * this option might be selected.
			 *
			 * By default, no `hint` is displayed.
			 */
			hint?: string;
			/**
			 * Whether this option is disabled.
			 * Disabled options are visible but cannot be selected.
			 *
			 * By default, options are not disabled.
			 */
			disabled?: boolean;
		};

export interface SelectOptions<Value> extends CommonOptions {
	message: string;
	options: Option<Value>[];
	initialValue?: Value;
	maxItems?: number;
}

const computeLabel = (label: string, format: (text: string) => string) => {
	if (!label.includes('\n')) {
		return format(label);
	}
	return label
		.split('\n')
		.map((line) => format(line))
		.join('\n');
};

export const select = <Value>(opts: SelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' | 'disabled'
	) => {
		const label = option.label ?? String(option.value);
		switch (state) {
			case 'disabled':
				return `${color.gray(S_RADIO_INACTIVE)} ${computeLabel(label, color.gray)}${
					option.hint ? ` ${color.dim(`(${option.hint ?? 'disabled'})`)}` : ''
				}`;
			case 'selected':
				return `${computeLabel(label, color.dim)}`;
			case 'active':
				return `${color.green(S_RADIO_ACTIVE)} ${label}${
					option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
				}`;
			case 'cancelled':
				return `${computeLabel(label, (str) => color.strikethrough(color.dim(str)))}`;
			default:
				return `${color.dim(S_RADIO_INACTIVE)} ${computeLabel(label, color.dim)}`;
		}
	};

	return new SelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		render() {
			const titlePrefix = `${symbol(this.state)}  `;
			const titlePrefixBar = `${symbolBar(this.state)}  `;
			const messageLines = wrapTextWithPrefix(
				opts.output,
				opts.message,
				titlePrefixBar,
				titlePrefix
			);
			const title = `${color.gray(S_BAR)}\n${messageLines}\n`;

			switch (this.state) {
				case 'submit': {
					const submitPrefix = `${color.gray(S_BAR)}  `;
					const wrappedLines = wrapTextWithPrefix(
						opts.output,
						opt(this.options[this.cursor], 'selected'),
						submitPrefix
					);
					return `${title}${wrappedLines}`;
				}
				case 'cancel': {
					const cancelPrefix = `${color.gray(S_BAR)}  `;
					const wrappedLines = wrapTextWithPrefix(
						opts.output,
						opt(this.options[this.cursor], 'cancelled'),
						cancelPrefix
					);
					return `${title}${wrappedLines}\n${color.gray(S_BAR)}`;
				}
				default: {
					const prefix = `${color.cyan(S_BAR)}  `;
					// Calculate rowPadding: title lines + footer lines (S_BAR_END + trailing newline)
					const titleLineCount = title.split('\n').length;
					const footerLineCount = 2; // S_BAR_END + trailing newline
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						cursor: this.cursor,
						options: this.options,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: (item, active) =>
							opt(item, item.disabled ? 'disabled' : active ? 'active' : 'inactive'),
					}).join(`\n${prefix}`)}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};
