import type { Key } from 'node:readline';
import type { Action } from './utils/settings.js';

/**
 * The state of the prompt
 */
export type ClackState = 'initial' | 'active' | 'cancel' | 'submit' | 'error';

/**
 * Options shared by all Clack prompts
 */
export interface CommonPromptOptions {
	/**
	 * Force accessible (static, screen-reader friendly) output for this prompt.
	 * Overrides the global `accessible` setting and the `ACCESSIBLE` env var.
	 */
	accessible?: boolean;
}

/**
 * Typed event emitter for clack
 */
export interface ClackEvents<TValue> {
	initial: (value?: any) => void;
	active: (value?: any) => void;
	cancel: (value?: any) => void;
	submit: (value?: any) => void;
	error: (value?: any) => void;
	cursor: (key?: Action) => void;
	key: (key: string | undefined, info: Key) => void;
	value: (value?: TValue) => void;
	userInput: (value: string) => void;
	confirm: (value?: boolean) => void;
	finalize: () => void;
	beforePrompt: () => void;
}
