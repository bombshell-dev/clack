import { styleText } from 'node:util';
import { SelectPrompt } from '@clack/core';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE,
	symbol,
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

export const select = <Value>(opts: SelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' | 'disabled'
	) => {
		const label = option.label ?? String(option.value);
		switch (state) {
			case 'disabled':
				return `${styleText('gray', S_RADIO_INACTIVE)} ${styleText('gray', label)}${
					option.hint ? ` ${styleText('dim', `(${option.hint ?? 'disabled'})`)}` : ''
				}`;
			case 'selected':
				return `${styleText('dim', label)}`;
			case 'active':
				return `${styleText('green', S_RADIO_ACTIVE)} ${label}${
					option.hint ? ` ${styleText('dim', `(${option.hint})`)}` : ''
				}`;
			case 'cancelled':
				return `${styleText('strikethrough', styleText('dim', label))}`;
			default:
				return `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', label)}`;
		}
	};

	return new SelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		render() {
			const title = `${styleText('gray', S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			switch (this.state) {
				case 'submit':
					return `${title}${styleText('gray', S_BAR)}  ${opt(this.options[this.cursor], 'selected')}`;
				case 'cancel':
					return `${title}${styleText('gray', S_BAR)}  ${opt(
						this.options[this.cursor],
						'cancelled'
					)}\n${styleText('gray', S_BAR)}`;
				default: {
					const prefix = `${styleText('cyan', S_BAR)}  `;
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						cursor: this.cursor,
						options: this.options,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						style: (item, active) =>
							opt(item, item.disabled ? 'disabled' : active ? 'active' : 'inactive'),
					}).join(`\n${prefix}`)}\n${styleText('cyan', S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};
