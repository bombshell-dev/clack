import { styleText } from 'node:util';
import { settings } from '@clack/core';
import {
	type CommonOptions,
	S_BAR,
	S_ERROR,
	S_INFO,
	S_STEP_SUBMIT,
	S_SUCCESS,
	S_WARN,
} from './common.js';

/**
 * Options for the {@link log} utility.
 */
export interface LogMessageOptions extends CommonOptions {
	/**
	 * Custom symbol to display before the message. Overrides the default semantic symbol.
	 */
	symbol?: string;

	/**
	 * Number of blank lines to prepend before the message.
	 */
	spacing?: number;

	/**
	 * Custom symbol used for secondary lines (continuation lines) when `withGuide` is enabled.
	 */
	secondarySymbol?: string;
}

/**
 * Utility functions for displaying semantic log messages with specific styling.
 *
 * Each method renders with a distinct symbol and color to communicate the status
 * of an operation. Messages support multi-line text and guide characters for
 * visual alignment with other log output.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#logs
 *
 * @example
 * ```ts
 * import { log } from '@clack/prompts';
 *
 * log.message('Hello world');
 * log.info('Information message');
 * log.success('Operation complete');
 * log.step('Processing item 3 of 10');
 * log.warn('Disk space running low');
 * log.error('Connection refused');
 * ```
 */
export const log = {
	/**
	 * Display a message with the given styling. Supports single strings or
	 * arrays (each element becomes a separate line).
	 *
	 * @example
	 * ```ts
	 * log.message('Build complete');
	 * log.message(['Step 1: Done', 'Step 2: Done', 'Step 3: Done']);
	 * ```
	 */
	message: (
		message: string | string[] = [],
		{
			symbol = styleText('gray', S_BAR),
			secondarySymbol = styleText('gray', S_BAR),
			output = process.stdout,
			spacing = 1,
			withGuide,
		}: LogMessageOptions = {}
	) => {
		const parts: string[] = [];
		const hasGuide = withGuide ?? settings.withGuide;
		const spacingString = !hasGuide ? '' : secondarySymbol;
		const prefix = !hasGuide ? '' : `${symbol}  `;
		const secondaryPrefix = !hasGuide ? '' : `${secondarySymbol}  `;

		for (let i = 0; i < spacing; i++) {
			parts.push(spacingString);
		}

		const messageParts = Array.isArray(message) ? message : message.split('\n');
		if (messageParts.length > 0) {
			const [firstLine, ...lines] = messageParts;
			if (firstLine.length > 0) {
				parts.push(`${prefix}${firstLine}`);
			} else {
				parts.push(hasGuide ? symbol : '');
			}
			for (const ln of lines) {
				if (ln.length > 0) {
					parts.push(`${secondaryPrefix}${ln}`);
				} else {
					parts.push(hasGuide ? secondarySymbol : '');
				}
			}
		}
		output.write(`${parts.join('\n')}\n`);
	},

	/**
	 * Display an informational message with a blue info symbol.
	 */
	info: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('blue', S_INFO) });
	},

	/**
	 * Display a success message with a green checkmark symbol.
	 */
	success: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('green', S_SUCCESS) });
	},

	/**
	 * Display a step completion message with a green checkmark symbol.
	 */
	step: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('green', S_STEP_SUBMIT) });
	},

	/**
	 * Display a warning message with a yellow warning symbol.
	 */
	warn: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('yellow', S_WARN) });
	},

	/**
	 * Alias for {@link log.warn}.
	 */
	warning: (message: string, opts?: LogMessageOptions) => {
		log.warn(message, opts);
	},

	/**
	 * Display an error message with a red error symbol.
	 */
	error: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('red', S_ERROR) });
	},
};
