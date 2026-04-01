import type { Key } from 'node:readline';
import { styleText } from 'node:util';
import { findTextCursor } from '../utils/cursor.js';
import { type Action, settings } from '../utils/index.js';
import Prompt, { type PromptOptions } from './prompt.js';

export interface MultiLineOptions extends PromptOptions<string, MultiLinePrompt> {
	placeholder?: string;
	defaultValue?: string;
	showSubmit?: boolean;
}

export default class MultiLinePrompt extends Prompt<string> {
	#lastKeyWasReturn = false;
	#showSubmit: boolean;
	public focused: 'editor' | 'submit' = 'editor';

	get userInputWithCursor() {
		if (this.state === 'submit') {
			return this.userInput;
		}
		const userInput = this.userInput;
		if (this.cursor >= userInput.length) {
			return `${userInput}█`;
		}
		const s1 = userInput.slice(0, this.cursor);
		const s2 = userInput[this.cursor];
		const s3 = userInput.slice(this.cursor + 1);
		if (s2 === '\n') return `${s1}█\n${s3}`;
		return `${s1}${styleText('inverse', s2)}${s3}`;
	}
	get cursor() {
		return this._cursor;
	}
	#insertAtCursor(char: string) {
		if (this.userInput.length === 0) {
			this._setUserInput(char);
			return;
		}
		this._setUserInput(
			this.userInput.slice(0, this.cursor) + char + this.userInput.slice(this.cursor)
		);
	}
	#handleCursor(key?: Action) {
		const text = this.value ?? '';
		switch (key) {
			case 'up':
				this._cursor = findTextCursor(this._cursor, 0, -1, text);
				return;
			case 'down':
				this._cursor = findTextCursor(this._cursor, 0, 1, text);
				return;
			case 'left':
				this._cursor = findTextCursor(this._cursor, -1, 0, text);
				return;
			case 'right':
				this._cursor = findTextCursor(this._cursor, 1, 0, text);
				return;
		}
	}

	protected override _shouldSubmit(_char: string | undefined, _key: Key): boolean {
		if (this.#showSubmit) {
			if (this.focused === 'submit') {
				return true;
			}
			this.#insertAtCursor('\n');
			this._cursor++;
			return false;
		}
		const wasReturn = this.#lastKeyWasReturn;
		this.#lastKeyWasReturn = true;
		if (wasReturn) {
			if (this.userInput[this.cursor - 1] === '\n') {
				this._setUserInput(
					this.userInput.slice(0, this.cursor - 1) + this.userInput.slice(this.cursor)
				);
				this._cursor--;
			}
			return true;
		}
		this.#insertAtCursor('\n');
		this._cursor++;
		return false;
	}

	constructor(opts: MultiLineOptions) {
		super(opts, false);
		this.#showSubmit = opts.showSubmit ?? false;

		this.on('key', (char, key) => {
			if (key?.name && settings.actions.has(key.name as Action)) {
				this.#handleCursor(key.name as Action);
				return;
			}
			if (char === '\t' && this.#showSubmit) {
				this.focused = this.focused === 'editor' ? 'submit' : 'editor';
				return;
			}
			if (key?.name === 'return') {
				return;
			}
			this.#lastKeyWasReturn = false;
			if (key?.name === 'backspace' && this.cursor > 0) {
				this._setUserInput(
					this.userInput.slice(0, this.cursor - 1) + this.userInput.slice(this.cursor)
				);
				this._cursor--;
				return;
			}
			if (key?.name === 'delete' && this.cursor < this.userInput.length) {
				this._setUserInput(
					this.userInput.slice(0, this.cursor) + this.userInput.slice(this.cursor + 1)
				);
				return;
			}
			if (char) {
				if (this.#showSubmit && this.focused === 'submit') {
					this.focused = 'editor';
				}
				this.#insertAtCursor(char ?? '');
				this._cursor++;
			}
		});

		this.on('userInput', (input) => {
			this._setValue(input);
		});
		this.on('finalize', () => {
			if (!this.value) {
				this.value = opts.defaultValue;
			}
			if (this.value === undefined) {
				this.value = '';
			}
		});
	}
}
