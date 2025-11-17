import { SelectPrompt, wrapTextWithPrefix } from '@clack/core';
import color from 'picocolors';
import { type CommonOptions, extendStyle, S_BAR, S_BAR_END } from './common.js';
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
	const style = extendStyle(opts.theme);
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' | 'disabled'
	) => {
		const label = option.label ?? String(option.value);
		switch (state) {
			case 'disabled':
				return `${style.radio.disabled} ${computeLabel(label, color.gray)}${
					option.hint ? ` ${color.dim(`(${option.hint ?? 'disabled'})`)}` : ''
				}`;
			case 'selected':
				return `${computeLabel(label, color.dim)}`;
			case 'active':
				return `${style.radio.active} ${label}${
					option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
				}`;
			case 'cancelled':
				return `${computeLabel(label, (str) => color.strikethrough(color.dim(str)))}`;
			default:
				return `${style.radio.inactive} ${computeLabel(label, color.dim)}`;
		}
	};

	return new SelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		render() {
			const bar = style.formatBar[this.state](S_BAR);
			const titlePrefix = `${style.prefix[this.state]}  `;
			const titlePrefixBar = `${bar}  `;
			const messageLines = wrapTextWithPrefix(
				opts.output,
				opts.message,
				titlePrefixBar,
				titlePrefix
			);
			const title = `${color.gray(S_BAR)}\n${messageLines}\n`;

			switch (this.state) {
				case 'submit': {
					const submitPrefix = `${bar}  `;
					const wrappedLines = wrapTextWithPrefix(
						opts.output,
						opt(this.options[this.cursor], 'selected'),
						submitPrefix
					);
					return `${title}${wrappedLines}`;
				}
				case 'cancel': {
					const cancelPrefix = `${bar}  `;
					const wrappedLines = wrapTextWithPrefix(
						opts.output,
						opt(this.options[this.cursor], 'cancelled'),
						cancelPrefix
					);
					return `${title}${wrappedLines}\n${bar}`;
				}
				default: {
					const prefix = `${bar}  `;
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						cursor: this.cursor,
						options: this.options,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						style: (item, active) =>
							opt(item, item.disabled ? 'disabled' : active ? 'active' : 'inactive'),
					}).join(`\n${prefix}`)}\n${style.formatBar[this.state](S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};
