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

type ColorState = `color${Capitalize<State>}`;
type PrefixState = `prefix${Capitalize<State>}`;

export type CommonOptions<TStyle = unknown> = {
	input?: Readable;
	output?: Writable;
	signal?: AbortSignal;
} & (TStyle extends object ? {
	theme?: 
		{ [K in ColorState]?: (str: string) => string } &
		{ [K in PrefixState]?: string }
		& TStyle;
} : {});

export interface RadioTheme {
	radioActive?: string;
	radioInactive?: string;
	radioDisabled?: string;
}

export interface CheckboxTheme {
	checkboxSelectedActive?: string,
	checkboxSelectedInactive?: string,
	checkboxUnselectedActive?: string,
	checkboxUnselectedInactive?: string,
	checkboxDisabled?: string,
}

const defaultStyle: CommonOptions<RadioTheme & CheckboxTheme>['theme'] = {
	colorInitial: color.cyan,
	colorActive: color.cyan,
	colorCancel: color.gray,
	colorError: color.yellow,
	colorSubmit: color.gray,

	prefixInitial: color.cyan(S_STEP_ACTIVE),
	prefixActive: color.cyan(S_STEP_ACTIVE),
	prefixCancel: color.red(S_STEP_CANCEL),
	prefixError: color.yellow(S_STEP_ERROR),
	prefixSubmit: color.green(S_STEP_SUBMIT),

	radioActive: color.green(S_RADIO_ACTIVE),
	radioInactive: color.dim(S_RADIO_INACTIVE),
	radioDisabled: color.gray(S_RADIO_INACTIVE),

	checkboxSelectedActive: color.green(S_CHECKBOX_SELECTED),
	checkboxSelectedInactive: color.green(S_CHECKBOX_SELECTED),
	checkboxUnselectedActive: color.cyan(S_CHECKBOX_ACTIVE),
	checkboxUnselectedInactive: color.dim(S_CHECKBOX_INACTIVE),
	checkboxDisabled: color.gray(S_CHECKBOX_INACTIVE),
};

type ExtendStyleType<TStyle> = ({ theme: {} } & CommonOptions<TStyle>)['theme'];

export const extendStyle = <TStyle>(style?: ExtendStyleType<TStyle>) => {
	return {
		...defaultStyle,
		...(style ?? {})
	} as Required<ExtendStyleType<TStyle>>;
};

const capitalize = (str: string): string => str[0].toUpperCase() + str.substring(1);

export const getThemeColor = (state: State) => (`color${capitalize(state)}`) as ColorState;
export const getThemePrefix = (state: State) => (`prefix${capitalize(state)}`) as PrefixState;
