import type { Key } from 'node:readline';
import { styleText } from 'node:util';
import { findTextCursor } from '../utils/cursor.js';
import Prompt, { type PromptOptions } from './prompt.js';

type CursorAction = 'up' | 'down' | 'left' | 'right';
const cursorActions = new Set<CursorAction>(['up', 'down', 'left', 'right']);

// readline reports keys like backspace or ctrl+a as a control character (`\x7f`, `\x01`)
function isControlCharacter(char: string): boolean {
	const code = char.charCodeAt(0);
	return code === 0x7f || (code < 0x20 && char !== '\t' && char !== '\n');
}

// true when `index` sits between the two halves of a surrogate pair (an emoji, for example)
function splitsSurrogatePair(text: string, index: number): boolean {
	const high = text.charCodeAt(index - 1);
	const low = text.charCodeAt(index);
	return high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff;
}

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
		const cursorEnd = this.cursor + (splitsSurrogatePair(userInput, this.cursor + 1) ? 2 : 1);
		const preCursor = userInput.slice(0, this.cursor);
		const cursorChar = userInput.slice(this.cursor, cursorEnd);
		const rest = userInput.slice(cursorEnd);
		if (cursorChar === '\n') return `${preCursor}█\n${rest}`;
		return `${preCursor}${styleText('inverse', cursorChar)}${rest}`;
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
	#handleCursor(key?: CursorAction) {
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
		if (wasReturn && this.cursor === this.userInput.length) {
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
		const initialUserInput = opts.initialUserInput ?? opts.initialValue;

		super(
			{
				...opts,
				initialUserInput,
			},
			false
		);

		if (initialUserInput !== undefined) {
			this._cursor = initialUserInput.length;
		}

		this.#showSubmit = opts.showSubmit ?? false;

		this.on('key', (char, key) => {
			if (key?.name && cursorActions.has(key.name as CursorAction)) {
				this.#lastKeyWasReturn = false;
				this.#handleCursor(key.name as CursorAction);
				if (splitsSurrogatePair(this.userInput, this._cursor)) {
					this._cursor += key.name === 'right' ? 1 : -1;
				}
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
			if (char && !isControlCharacter(char)) {
				if (this.#showSubmit && this.focused === 'submit') {
					this.focused = 'editor';
				}
				this.#insertAtCursor(char ?? '');
				this._cursor += char.length;
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
