import { styleText } from 'node:util';
import { ConfirmPrompt, settings, wrapTextWithPrefix } from '@clack/core';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE,
	symbol,
} from './common.js';

/**
 * Options for the {@link confirm} component.
 */
export interface ConfirmOptions extends CommonOptions {
	/**
	 * The message to display to the user.
	 */
	message: string;

	/**
	 * The label to use for the active (true) option.
	 * @default 'Yes'
	 */
	active?: string;

	/**
	 * The label to use for the inactive (false) option.
	 * @default 'No'
	 */
	inactive?: string;

	/**
	 * The initial selected value (true or false).
	 * @default true
	 */
	initialValue?: boolean;

	/**
	 * Whether to render the options vertically instead of horizontally.
	 * @default false
	 */
	vertical?: boolean;
}

/**
 * The `confirm` prompt asks the user to confirm or decline an action with a yes/no choice.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#confirmation
 *
 * @example
 * ```ts
 * import { confirm } from '@clack/prompts';
 *
 * const shouldProceed = await confirm({
 *   message: 'Do you want to continue?',
 * });
 * ```
 */
export const confirm = (opts: ConfirmOptions) => {
	const active = opts.active ?? 'Yes';
	const inactive = opts.inactive ?? 'No';
	return new ConfirmPrompt({
		active,
		inactive,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue ?? true,
		render() {
			const hasGuide = opts.withGuide ?? settings.withGuide;
			const titlePrefix = `${symbol(this.state)}  `;
			const titlePrefixBar = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
			const messageLines = wrapTextWithPrefix(
				opts.output,
				opts.message,
				titlePrefixBar,
				titlePrefix
			);
			const title = `${hasGuide ? `${styleText('gray', S_BAR)}\n` : ''}${messageLines}\n`;
			const value = this.value ? active : inactive;

			switch (this.state) {
				case 'submit': {
					const submitPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					return `${title}${submitPrefix}${styleText('dim', value)}`;
				}
				case 'cancel': {
					const cancelPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					return `${title}${cancelPrefix}${styleText(['strikethrough', 'dim'], value)}${
						hasGuide ? `\n${styleText('gray', S_BAR)}` : ''
					}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? styleText('cyan', S_BAR_END) : '';
					return `${title}${defaultPrefix}${
						this.value
							? `${styleText('green', S_RADIO_ACTIVE)} ${active}`
							: `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', active)}`
					}${opts.vertical ? (hasGuide ? `\n${styleText('cyan', S_BAR)}  ` : '\n') : ` ${styleText('dim', '/')} `}${
						!this.value
							? `${styleText('green', S_RADIO_ACTIVE)} ${inactive}`
							: `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', inactive)}`
					}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
};
