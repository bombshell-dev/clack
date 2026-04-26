import { styleText } from 'node:util';
import { MultiLinePrompt, settings, wrapTextWithPrefix } from '@clack/core';
import { S_BAR, S_BAR_END, symbol } from './common.js';
import type { TextOptions } from './text.js';

/**
 * Options for the {@link multiline} component
 */
export interface MultiLineOptions extends TextOptions {
	/**
	 * When `true`, shows a `[ submit ]` button that can be focused with tab.
	 * @default false
	 */
	showSubmit?: boolean;
}

/**
 * The `multiline` prompt allows multi-line text input.
 *
 * @example
 * ```ts
 * import { multiline } from '@clack/prompts';
 *
 * const bio = await multiline({
 *   message: 'Enter your bio',
 *   placeholder: 'Tell us about yourself...',
 *   showSubmit: true,
 * });
 * ```
 */
export const multiline = (opts: MultiLineOptions) => {
	return new MultiLinePrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		showSubmit: opts.showSubmit,
		output: opts.output,
		signal: opts.signal,
		input: opts.input,
		render() {
			const hasGuide = opts?.withGuide ?? settings.withGuide;
			const titlePrefix = `${hasGuide ? `${styleText('gray', S_BAR)}\n` : ''}${symbol(this.state)}  `;
			const title = `${titlePrefix}${opts.message}\n`;
			const placeholder = opts.placeholder
				? styleText('inverse', opts.placeholder[0]) + styleText('dim', opts.placeholder.slice(1))
				: styleText(['inverse', 'hidden'], '_');
			const userInput = !this.userInput ? placeholder : this.userInputWithCursor;
			const value = this.value ?? '';
			const submitButton = opts.showSubmit
				? `\n  ${styleText(this.focused === 'submit' ? 'cyan' : 'dim', '[ submit ]')}`
				: '';
			switch (this.state) {
				case 'error': {
					const errorPrefix = `${styleText('yellow', S_BAR)}  `;
					const lines = hasGuide
						? wrapTextWithPrefix(opts.output, userInput, errorPrefix, undefined)
						: userInput;
					const errorPrefixEnd = styleText('yellow', S_BAR_END);
					return `${title}${lines}\n${errorPrefixEnd}  ${styleText('yellow', this.error)}${submitButton}\n`;
				}
				case 'submit': {
					const submitPrefix = `${styleText('gray', S_BAR)}  `;
					const lines = hasGuide
						? wrapTextWithPrefix(opts.output, value, submitPrefix, undefined, (str) =>
								styleText('dim', str)
							)
						: value
							? styleText('dim', value)
							: '';
					return `${title}${lines}`;
				}
				case 'cancel': {
					const cancelPrefix = `${styleText('gray', S_BAR)}  `;
					const lines = hasGuide
						? wrapTextWithPrefix(opts.output, value, cancelPrefix, undefined, (str) =>
								styleText(['strikethrough', 'dim'], str)
							)
						: value
							? styleText(['strikethrough', 'dim'], value)
							: '';
					return `${title}${lines}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? styleText('cyan', S_BAR_END) : '';
					const lines = hasGuide
						? wrapTextWithPrefix(opts.output, userInput, defaultPrefix)
						: userInput;
					return `${title}${lines}\n${defaultPrefixEnd}${submitButton}\n`;
				}
			}
		},
	}).prompt() as Promise<string | symbol>;
};
