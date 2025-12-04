import { settings, TextPrompt } from '@clack/core';
import color from 'picocolors';
import {
	type ColorFormatter,
	type CommonOptions,
	defaultGlobalTheme,
	type GlobalTheme,
	resolveTheme,
	S_BAR,
	S_BAR_END,
	S_STEP_ACTIVE,
	S_STEP_CANCEL,
	S_STEP_ERROR,
	S_STEP_SUBMIT,
	type ThemeOptions,
} from './common.js';

/**
 * Theme options specific to the text prompt.
 * All formatters are optional - defaults will be used if not provided.
 */
export interface TextTheme {
	/** Format the prompt symbol in active/initial state (default: cyan) */
	formatSymbolActive?: ColorFormatter;
	/** Format the prompt symbol on submit (default: green) */
	formatSymbolSubmit?: ColorFormatter;
	/** Format the prompt symbol on cancel (default: red) */
	formatSymbolCancel?: ColorFormatter;
	/** Format the prompt symbol on error (default: yellow) */
	formatSymbolError?: ColorFormatter;
	/** Format error messages (default: yellow) */
	formatErrorMessage?: ColorFormatter;
}

/** Default theme values for the text prompt */
const defaultTextTheme: Required<TextTheme & GlobalTheme> = {
	...defaultGlobalTheme,
	formatSymbolActive: color.cyan,
	formatSymbolSubmit: color.green,
	formatSymbolCancel: color.red,
	formatSymbolError: color.yellow,
	formatErrorMessage: color.yellow,
};

export interface TextOptions extends CommonOptions, ThemeOptions<TextTheme> {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	initialValue?: string;
	validate?: (value: string | undefined) => string | Error | undefined;
}

export const text = (opts: TextOptions) => {
	const theme = resolveTheme<Required<TextTheme & GlobalTheme>>(opts.theme, defaultTextTheme);

	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		output: opts.output,
		signal: opts.signal,
		input: opts.input,
		render() {
			const hasGuide = (opts?.withGuide ?? settings.withGuide) !== false;

			// Resolve symbol based on state
			const symbolText = (() => {
				switch (this.state) {
					case 'initial':
					case 'active':
						return theme.formatSymbolActive(S_STEP_ACTIVE);
					case 'cancel':
						return theme.formatSymbolCancel(S_STEP_CANCEL);
					case 'error':
						return theme.formatSymbolError(S_STEP_ERROR);
					case 'submit':
						return theme.formatSymbolSubmit(S_STEP_SUBMIT);
				}
			})();

			const titlePrefix = `${hasGuide ? `${color.gray(S_BAR)}\n` : ''}${symbolText}  `;
			const title = `${titlePrefix}${opts.message}\n`;
			const placeholder = opts.placeholder
				? color.inverse(opts.placeholder[0]) + color.dim(opts.placeholder.slice(1))
				: color.inverse(color.hidden('_'));
			const userInput = !this.userInput ? placeholder : this.userInputWithCursor;
			const value = this.value ?? '';

			switch (this.state) {
				case 'error': {
					const errorText = this.error ? `  ${theme.formatErrorMessage(this.error)}` : '';
					const errorPrefix = hasGuide ? `${theme.formatGuideError(S_BAR)}  ` : '';
					const errorPrefixEnd = hasGuide ? theme.formatGuideError(S_BAR_END) : '';
					return `${title.trim()}\n${errorPrefix}${userInput}\n${errorPrefixEnd}${errorText}\n`;
				}
				case 'submit': {
					const valueText = value ? `  ${color.dim(value)}` : '';
					const submitPrefix = hasGuide ? theme.formatGuideSubmit(S_BAR) : '';
					return `${title}${submitPrefix}${valueText}`;
				}
				case 'cancel': {
					const valueText = value ? `  ${color.strikethrough(color.dim(value))}` : '';
					const cancelPrefix = hasGuide ? theme.formatGuideCancel(S_BAR) : '';
					return `${title}${cancelPrefix}${valueText}${value.trim() ? `\n${cancelPrefix}` : ''}`;
				}
				default: {
					const defaultPrefix = hasGuide ? `${theme.formatGuide(S_BAR)}  ` : '';
					const defaultPrefixEnd = hasGuide ? theme.formatGuide(S_BAR_END) : '';
					return `${title}${defaultPrefix}${userInput}\n${defaultPrefixEnd}\n`;
				}
			}
		},
	}).prompt() as Promise<string | symbol>;
};
