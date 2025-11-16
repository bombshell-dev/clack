import type { Readable, Writable } from 'node:stream';
import type { State } from '@clack/core';
import deepmerge from '@fastify/deepmerge';
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

export interface CommonOptions {
	input?: Readable;
	output?: Writable;
	signal?: AbortSignal;
	theme?: ThemeOptions;
}

export interface ThemeOptions {
	formatBar?: { [K in State]?: (str: string) => string };
	prefix?: { [K in State]?: string };
	radio?: {
		active?: string;
		inactive?: string;
		disabled?: string;
	};
	checkbox?: {
		selected?: {
			active?: string;
			inactive?: string;
		};
		unselected?: {
			active?: string;
			inactive?: string;
		};
		disabled?: string;
	};
}

const defaultStyle: ThemeOptions = {
	formatBar: {
		initial: color.cyan,
		active: color.cyan,
		cancel: color.gray,
		error: color.yellow,
		submit: color.gray,
	},
	prefix: {
		initial: color.cyan(S_STEP_ACTIVE),
		active: color.cyan(S_STEP_ACTIVE),
		cancel: color.red(S_STEP_CANCEL),
		error: color.yellow(S_STEP_ERROR),
		submit: color.green(S_STEP_SUBMIT),
	},
	radio: {
		active: color.green(S_RADIO_ACTIVE),
		inactive: color.dim(S_RADIO_INACTIVE),
		disabled: color.gray(S_RADIO_INACTIVE),
	},
	checkbox: {
		selected: {
			active: color.green(S_CHECKBOX_SELECTED),
			inactive: color.green(S_CHECKBOX_SELECTED),
		},
		unselected: {
			active: color.cyan(S_CHECKBOX_ACTIVE),
			inactive: color.dim(S_CHECKBOX_INACTIVE),
		},
		disabled: color.gray(S_CHECKBOX_INACTIVE),
	},
};

type DeepRequired<T> = T extends object
	? T extends (...args: any[]) => any
		? T
		: { [K in keyof T]-?: DeepRequired<T[K]> }
	: T;

const merge = deepmerge();

export const extendStyle = (style?: ThemeOptions) => {
	return merge(defaultStyle, style ?? {}) as DeepRequired<ThemeOptions>;
};
