import type { Readable, Writable } from 'node:stream';
import { styleText } from 'node:util';
import type { State } from '@clack/core';
import isUnicodeSupported from 'is-unicode-supported';

/**
 * Whether the current terminal supports unicode characters.
 */
export const unicode = isUnicodeSupported();

/**
 * Returns `true` if the process is running in a CI environment.
 */
export const isCI = (): boolean => process.env.CI === 'true';

/**
 * Returns `true` if the given output stream is a TTY.
 */
export const isTTY = (output: Writable): boolean => {
	return (output as Writable & { isTTY?: boolean }).isTTY === true;
};

/**
 * Returns the unicode character if supported, otherwise the corresponding fallback character.
 */
export const unicodeOr = (c: string, fallback: string) => (unicode ? c : fallback);

// ── Step symbols ──────────────────────────────────────────────────────────────

/**
 * Symbol shown for a step currently in progress (active).
 */
export const S_STEP_ACTIVE = unicodeOr('◆', '*');

/**
 * Symbol shown for a step that was cancelled.
 */
export const S_STEP_CANCEL = unicodeOr('■', 'x');

/**
 * Symbol shown for a step that encountered an error.
 */
export const S_STEP_ERROR = unicodeOr('▲', 'x');

/**
 * Symbol shown for a step that was submitted successfully.
 */
export const S_STEP_SUBMIT = unicodeOr('◇', 'o');

// ── Guide bar symbols ─────────────────────────────────────────────────────────

/**
 * Top-left corner of the guide bar.
 */
export const S_BAR_START = unicodeOr('┌', 'T');

/**
 * Vertical bar used in guide lines.
 */
export const S_BAR = unicodeOr('│', '|');

/**
 * Bottom-left corner of the guide bar.
 */
export const S_BAR_END = unicodeOr('└', '—');

/**
 * Top-right corner of the guide bar.
 */
export const S_BAR_START_RIGHT = unicodeOr('┐', 'T');

/**
 * Bottom-right corner of the guide bar.
 */
export const S_BAR_END_RIGHT = unicodeOr('┘', '—');

// ── Radio / checkbox symbols ──────────────────────────────────────────────────

/**
 * Symbol for an active (focused) radio button.
 */
export const S_RADIO_ACTIVE = unicodeOr('●', '>');

/**
 * Symbol for an inactive radio button.
 */
export const S_RADIO_INACTIVE = unicodeOr('○', ' ');

/**
 * Symbol for an active (focused) checkbox.
 */
export const S_CHECKBOX_ACTIVE = unicodeOr('◻', '[•]');

/**
 * Symbol for a selected checkbox.
 */
export const S_CHECKBOX_SELECTED = unicodeOr('◼', '[+]');

/**
 * Symbol for an inactive checkbox.
 */
export const S_CHECKBOX_INACTIVE = unicodeOr('◻', '[ ]');

/**
 * Mask character used in the password prompt.
 */
export const S_PASSWORD_MASK = unicodeOr('▪', '•');

// ── Box drawing symbols ───────────────────────────────────────────────────────

/**
 * Horizontal bar used in box drawing.
 */
export const S_BAR_H = unicodeOr('─', '-');

/**
 * Top-right corner of a box.
 */
export const S_CORNER_TOP_RIGHT = unicodeOr('╮', '+');

/**
 * Left connector (T-junction) in box drawing.
 */
export const S_CONNECT_LEFT = unicodeOr('├', '+');

/**
 * Bottom-right corner of a box.
 */
export const S_CORNER_BOTTOM_RIGHT = unicodeOr('╯', '+');

/**
 * Bottom-left corner of a box.
 */
export const S_CORNER_BOTTOM_LEFT = unicodeOr('╰', '+');

/**
 * Top-left corner of a box.
 */
export const S_CORNER_TOP_LEFT = unicodeOr('╭', '+');

// ── Status icons ──────────────────────────────────────────────────────────────

/**
 * Info icon.
 */
export const S_INFO = unicodeOr('●', '•');

/**
 * Success icon.
 */
export const S_SUCCESS = unicodeOr('◆', '*');

/**
 * Warning icon.
 */
export const S_WARN = unicodeOr('▲', '!');

/**
 * Error icon.
 */
export const S_ERROR = unicodeOr('■', 'x');

// ── Symbol helpers ────────────────────────────────────────────────────────────

/**
 * Returns a styled symbol for a given prompt state.
 *
 * Maps each `State` value to the appropriate step symbol styled with the
 * corresponding color: `cyan` for initial/active, `red` for cancel,
 * `yellow` for error, and `green` for submit.
 */
export const symbol = (state: State) => {
	switch (state) {
		case 'initial':
		case 'active':
			return styleText('cyan', S_STEP_ACTIVE);
		case 'cancel':
			return styleText('red', S_STEP_CANCEL);
		case 'error':
			return styleText('yellow', S_STEP_ERROR);
		case 'submit':
			return styleText('green', S_STEP_SUBMIT);
	}
};

/**
 * Returns a styled vertical bar for a given prompt state.
 *
 * Returns the same `S_BAR` character styled with the corresponding color
 * for each state: `cyan` for initial/active, `red` for cancel,
 * `yellow` for error, and `green` for submit.
 */
export const symbolBar = (state: State) => {
	switch (state) {
		case 'initial':
		case 'active':
			return styleText('cyan', S_BAR);
		case 'cancel':
			return styleText('red', S_BAR);
		case 'error':
			return styleText('yellow', S_BAR);
		case 'submit':
			return styleText('green', S_BAR);
	}
};

/**
 * Common options shared by all prompts.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#common-options
 */
export interface CommonOptions {
	/**
	 * Custom readable stream for input (e.g. a file or pipe).
	 */
	input?: Readable;

	/**
	 * Custom writable stream for output (e.g. a file or pipe).
	 */
	output?: Writable;

	/**
	 * An `AbortSignal` for programmatic cancellation of the prompt.
	 */
	signal?: AbortSignal;

	/**
	 * When `true`, renders guide lines (border bars) alongside the prompt.
	 *
	 * @default false
	 */
	withGuide?: boolean;
}
