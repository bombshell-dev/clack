import { styleText } from 'node:util';
import { settings, TextPrompt } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, symbol } from './common.js';

/**
 * Options for the {@link text} component
 */
export interface TextOptions extends CommonOptions {
	/**
	 * The message to display to the user.
	 */
	message: string;

	/**
	 * A placeholder string displayed when the input is empty.
	 * The first character is shown in inverse video, the rest in dim text.
	 */
	placeholder?: string;

	/**
	 * A default value pre-filled in the input field.
	 */
	defaultValue?: string;

	/**
	 * An initial value to set in the input field.
	 * Unlike `defaultValue`, this is the actual initial state (not just a fallback).
	 */
	initialValue?: string;

	/**
	 * A validation function that receives the current input value.
	 * Return a string or Error to display as a validation error, or `undefined` to accept the value.
	 */
	validate?: (value: string | undefined) => string | Error | undefined;
}

/**
 * The `text` prompt displays a single-line text input for collecting string values from the user.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#text-input
 *
 * @example
 * ```ts
 * import { text } from '@clack/prompts';
 *
 * const name = await text({
 *   message: 'What is your name?',
 *   placeholder: 'John Doe',
 *   validate: (value) => {
 *     if (!value || value.length < 2) return 'Name must be at least 2 characters';
 *     return undefined;
 *   },
 * });
 * ```
 */
export const text = (opts: TextOptions) => {
	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
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

			switch (this.state) {
				case 'error': {
					const errorText = this.error ? `  ${styleText('yellow', this.error)}` : '';
					const errorPrefix = hasGuide ? `${styleText('yellow', S_BAR)}  ` : '';
					const errorPrefixEnd = hasGuide ? styleText('yellow', S_BAR_END) : '';
					return `${title.trim()}\n${errorPrefix}${userInput}\n${errorPrefixEnd}${errorText}\n`;
				}
				case 'submit': {
					const valueText = value ? `  ${styleText('dim', value)}` : '';
					const submitPrefix = hasGuide ? styleText('gray', S_BAR) : '';
					return `${title}${submitPrefix}${valueText}`;
				}
				case 'cancel': {
					const valueText = value ? `  ${styleText(['strikethrough', 'dim'], value)}` : '';
					const cancelPrefix = hasGuide ? styleText('gray', S_BAR) : '';
					return `${title}${cancelPrefix}${valueText}${value.trim() ? `\n${cancelPrefix}` : ''}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${styleText('cyan', S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? styleText('cyan', S_BAR_END) : '';
					return `${title}${defaultPrefix}${userInput}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<string | symbol>;
};
