import type { Readable, Writable } from 'node:stream';
import type { State } from '@clack/core';
import isUnicodeSupported from 'is-unicode-supported';
import color from 'picocolors';

export const unicode = isUnicodeSupported();
export const isCI = (): boolean => process.env.CI === 'true';
export const isTTY = (output: Writable): boolean => {
	return (output as Writable & { isTTY?: boolean }).isTTY === true;
};
export const unicodeOr = (c: string, fallback: string) => (unicode ? c : fallback);
export const S_STEP_ACTIVE = unicodeOr('◆', '*');
export const S_STEP_CANCEL = unicodeOr('■', 'x');
export const S_STEP_ERROR = unicodeOr('▲', 'x');
export const S_STEP_SUBMIT = unicodeOr('◇', 'o');

export const S_BAR_START = unicodeOr('┌', 'T');
export const S_BAR = unicodeOr('│', '|');
export const S_BAR_END = unicodeOr('└', '—');
export const S_BAR_START_RIGHT = unicodeOr('┐', 'T');
export const S_BAR_END_RIGHT = unicodeOr('┘', '—');

export const S_RADIO_ACTIVE = unicodeOr('●', '>');
export const S_RADIO_INACTIVE = unicodeOr('○', ' ');
export const S_CHECKBOX_ACTIVE = unicodeOr('◻', '[•]');
export const S_CHECKBOX_SELECTED = unicodeOr('◼', '[+]');
export const S_CHECKBOX_INACTIVE = unicodeOr('◻', '[ ]');
export const S_PASSWORD_MASK = unicodeOr('▪', '•');

export const S_BAR_H = unicodeOr('─', '-');
export const S_CORNER_TOP_RIGHT = unicodeOr('╮', '+');
export const S_CONNECT_LEFT = unicodeOr('├', '+');
export const S_CORNER_BOTTOM_RIGHT = unicodeOr('╯', '+');
export const S_CORNER_BOTTOM_LEFT = unicodeOr('╰', '+');
export const S_CORNER_TOP_LEFT = unicodeOr('╭', '+');

export const S_INFO = unicodeOr('●', '•');
export const S_SUCCESS = unicodeOr('◆', '*');
export const S_WARN = unicodeOr('▲', '!');
export const S_ERROR = unicodeOr('■', 'x');

export const symbol = (state: State) => {
	switch (state) {
		case 'initial':
		case 'active':
			return color.cyan(S_STEP_ACTIVE);
		case 'cancel':
			return color.red(S_STEP_CANCEL);
		case 'error':
			return color.yellow(S_STEP_ERROR);
		case 'submit':
			return color.green(S_STEP_SUBMIT);
	}
};

export const symbolBar = (state: State) => {
	switch (state) {
		case 'initial':
		case 'active':
			return color.cyan(S_BAR);
		case 'cancel':
			return color.red(S_BAR);
		case 'error':
			return color.yellow(S_BAR);
		case 'submit':
			return color.green(S_BAR);
	}
};

export interface CommonOptions {
	input?: Readable;
	output?: Writable;
	signal?: AbortSignal;
	withGuide?: boolean;
}

export type ColorFormatter = (str: string) => string;

/**
 * Global theme options shared across all prompts.
 * These control the common visual elements like the guide line.
 */
export interface GlobalTheme {
	/** Format the left guide/border line (default: cyan) */
	formatGuide?: ColorFormatter;
	/** Format the guide line on submit (default: gray) */
	formatGuideSubmit?: ColorFormatter;
	/** Format the guide line on cancel (default: gray) */
	formatGuideCancel?: ColorFormatter;
	/** Format the guide line on error (default: yellow) */
	formatGuideError?: ColorFormatter;
}

export interface ThemeOptions<T> {
	theme?: T & GlobalTheme;
}

export const defaultGlobalTheme: Required<GlobalTheme> = {
	formatGuide: color.cyan,
	formatGuideSubmit: color.gray,
	formatGuideCancel: color.gray,
	formatGuideError: color.yellow,
};

export function resolveTheme<T>(
	theme: Partial<T> | undefined,
	defaults: T
): T {
	return { ...defaults, ...theme };
}
