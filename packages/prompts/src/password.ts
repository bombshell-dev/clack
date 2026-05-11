import { styleText } from 'node:util';
import { PasswordPrompt, settings } from '@clack/core';
import { type CommonOptions, S_BAR, S_BAR_END, S_PASSWORD_MASK, symbol } from './common.js';

/**
 * Options for the {@link password} prompt
 */
export interface PasswordOptions extends CommonOptions {
	/**
	 * The prompt message or question shown to the user above the input.
	 */
	message: string;

	/**
	 * Character to use for masking input.
	 * @default ▪/•
	 */
	mask?: string;

	/**
	 * A function that validates user input. Return a `string` or `Error` to show as a
	 * validation error, or `undefined` to accept the result.
	 */
	validate?: (value: string | undefined) => string | Error | undefined;

	/**
	 * When enabled it causes the input to be cleared if/when validation fails.
	 * @default false
	 */
	clearOnError?: boolean;
}

/**
 * The password prompt behaves like the {@link text} prompt, but the input is masked.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#password-input
 *
 * @example
 * ```ts
 * import { password } from '@clack/prompts';
 *
 * const result = await password({
 *   message: 'Enter your password',
 * });
 * ```
 */
export const password = (opts: PasswordOptions) => {
	return new PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? S_PASSWORD_MASK,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render() {
			const hasGuide = opts.withGuide ?? settings.withGuide;
			const title = `${hasGuide ? `${styleText('gray', S_BAR)}\n` : ''}${symbol(this.state)}  ${opts.message}\n`;
			const userInput = this.userInputWithCursor;
			const masked = this.masked;

			switch (this.state) {
				case 'error': {
					const errorPrefix = hasGuide ? `${styleText('yellow', S_BAR)}  ` : '';
					const errorPrefixEnd = hasGuide ? `${styleText('yellow', S_BAR_END)}  ` : '';
					const maskedText = masked ?? '';
					if (opts.clearOnError) {
						this.clear();
					}
					return `${title.trim()}\n${errorPrefix}${maskedText}\n${errorPrefixEnd}${styleText('yellow', this.error)}\n`;
				}
				case 'submit': {
					const submitPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					const maskedText = masked ? styleText('dim', masked) : '';
					return `${title}${submitPrefix}${maskedText}`;
				}
				case 'cancel': {
					const cancelPrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
					const maskedText = masked ? styleText(['strikethrough', 'dim'], masked) : '';
					return `${title}${cancelPrefix}${maskedText}${
						masked && hasGuide ? `\n${styleText('gray', S_BAR)}` : ''
					}`;
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
