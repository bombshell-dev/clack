import type { Writable } from 'node:stream';
import { getColumns, SelectPrompt } from '@clack/core';
import { wrapAnsi } from 'fast-wrap-ansi';
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

export const select = <Value>(opts: SelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' | 'disabled'
	) => {
		const label = option.label ?? String(option.value);
		switch (state) {
			case 'disabled':
				return `${color.gray(S_RADIO_INACTIVE)} ${color.gray(label)}${
					option.hint ? ` ${color.dim(`(${option.hint ?? 'disabled'})`)}` : ''
				}`;
			case 'selected':
				return `${color.dim(label)}`;
			case 'active':
				return `${color.green(S_RADIO_ACTIVE)} ${label}${
					option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
				}`;
			case 'cancelled':
				return `${color.strikethrough(color.dim(label))}`;
			default:
				return `${color.dim(S_RADIO_INACTIVE)} ${color.dim(label)}`;
		}
	};

	return new SelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		render() {
			const output: Writable = opts?.output ?? process.stdout;
			const columns = getColumns(output);
			const titlePrefix = `${symbol(this.state)}  `;
			const titlePrefixBar = `${symbolBar(this.state)}  `;
			const wrappedMessage = wrapAnsi(
				opts.message,
				columns - Math.max(titlePrefix.length, titlePrefixBar.length),
				{
					hard: true,
					trim: false,
				}
			);
			const messageLines = wrappedMessage
				.split('\n')
				.map((line, index) => {
					return `${index === 0 ? titlePrefix : titlePrefixBar}${line}`;
				})
				.join('\n');
			const title = `${color.gray(S_BAR)}\n${messageLines}\n`;

			switch (this.state) {
				case 'submit': {
					const submitPrefix = `${color.gray(S_BAR)}  `;
					const wrappedOption = wrapAnsi(
						opt(this.options[this.cursor], 'selected'),
						columns - submitPrefix.length,
						{ hard: true, trim: false }
					);
					const wrappedLines = wrappedOption
						.split('\n')
						.map((line) => `${submitPrefix}${line}`)
						.join('\n');
					return `${title}${wrappedLines}`;
				}
				case 'cancel': {
					const cancelPrefix = `${color.gray(S_BAR)}  `;
					const wrappedOption = wrapAnsi(
						opt(this.options[this.cursor], 'cancelled'),
						columns - cancelPrefix.length,
						{ hard: true, trim: false }
					);
					const wrappedLines = wrappedOption
						.split('\n')
						.map((line) => `${cancelPrefix}${line}`)
						.join('\n');
					return `${title}${wrappedLines}\n${color.gray(S_BAR)}`;
				}
				default: {
					const prefix = `${color.cyan(S_BAR)}  `;
					return `${title}${prefix}${limitOptions({
						output: opts.output,
						cursor: this.cursor,
						options: this.options,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						style: (item, active) =>
							opt(item, item.disabled ? 'disabled' : active ? 'active' : 'inactive'),
					}).join(`\n${prefix}`)}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};
