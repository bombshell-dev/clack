import { styleText } from 'node:util';
import {
	type CommonOptions,
	S_BAR,
	S_ERROR,
	S_INFO,
	S_STEP_SUBMIT,
	S_SUCCESS,
	S_WARN,
} from './common.js';

export interface LogMessageOptions extends CommonOptions {
	symbol?: string;
	spacing?: number;
	secondarySymbol?: string;
}

export const log = {
	message: (
		message: string | string[] = [],
		{
			symbol = styleText('gray', S_BAR),
			secondarySymbol = styleText('gray', S_BAR),
			output = process.stdout,
			spacing = 1,
		}: LogMessageOptions = {}
	) => {
		const parts: string[] = [];
		for (let i = 0; i < spacing; i++) {
			parts.push(`${secondarySymbol}`);
		}
		const messageParts = Array.isArray(message) ? message : message.split('\n');
		if (messageParts.length > 0) {
			const [firstLine, ...lines] = messageParts;
			if (firstLine.length > 0) {
				parts.push(`${symbol}  ${firstLine}`);
			} else {
				parts.push(symbol);
			}
			for (const ln of lines) {
				if (ln.length > 0) {
					parts.push(`${secondarySymbol}  ${ln}`);
				} else {
					parts.push(secondarySymbol);
				}
			}
		}
		output.write(`${parts.join('\n')}\n`);
	},
	info: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('blue', S_INFO) });
	},
	success: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('green', S_SUCCESS) });
	},
	step: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('green', S_STEP_SUBMIT) });
	},
	warn: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('yellow', S_WARN) });
	},
	/** alias for `log.warn()`. */
	warning: (message: string, opts?: LogMessageOptions) => {
		log.warn(message, opts);
	},
	error: (message: string, opts?: LogMessageOptions) => {
		log.message(message, { ...opts, symbol: styleText('red', S_ERROR) });
	},
};
