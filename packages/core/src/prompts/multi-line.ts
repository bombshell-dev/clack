import { styleText } from 'node:util';
import { type Action, settings } from '../utils/index.js';
import Prompt, { type PromptOptions } from './prompt.js';

export interface MultiLineOptions extends PromptOptions<string, MultiLinePrompt> {
	placeholder?: string;
	defaultValue?: string;
}

export default class MultiLinePrompt extends Prompt<string> {
	get valueWithCursor() {
		if (this.state === 'submit') {
			return this.userInput;
		}
		const userInput = this.userInput;
		if (this.cursor >= userInput.length) {
			return `${userInput}█`;
		}
		const s1 = userInput.slice(0, this.cursor);
		const [s2, ...s3] = userInput.slice(this.cursor);
		return `${s1}${styleText('inverse', s2)}${s3.join('')}`;
	}
	get cursor() {
		return this._cursor;
	}
	insertAtCursor(char: string) {
		if (this.userInput.length === 0) {
			this.userInput = char;
			return;
		}
		this.userInput =
			this.userInput.substr(0, this.cursor) + char + this.userInput.substr(this.cursor);
	}
	handleCursor(key?: Action) {
		const text = this.value ?? '';
		const lines = text.split('\n');
		const beforeCursor = text.substr(0, this.cursor);
		const currentLine = beforeCursor.split('\n').length - 1;
		const lineStart = beforeCursor.lastIndexOf('\n');
		const cursorOffet = this.cursor - lineStart;
		switch (key) {
			case 'up':
				if (currentLine === 0) {
					this._cursor = 0;
					return;
				}
				this._cursor +=
					-cursorOffet -
					lines[currentLine - 1].length +
					Math.min(lines[currentLine - 1].length, cursorOffet - 1);
				return;
			case 'down':
				if (currentLine === lines.length - 1) {
					this._cursor = text.length;
					return;
				}
				this._cursor +=
					-cursorOffet +
					1 +
					lines[currentLine].length +
					Math.min(lines[currentLine + 1].length + 1, cursorOffet);
				return;
			case 'left':
				this._cursor = Math.max(0, this._cursor - 1);
				return;
			case 'right':
				this._cursor = Math.min(text.length, this._cursor + 1);
				return;
		}
	}
	constructor(opts: MultiLineOptions) {
		super(opts, false);

		this.on('key', (char, key) => {
			if (key?.name && settings.actions.has(key.name as Action)) {
				this.handleCursor(key.name as Action);
			}
			if (char === '\r') {
				this.insertAtCursor('\n');
				this._cursor++;
				return;
			}
			if (char === '\u0004') {
				return;
			}
			if (key?.name === 'backspace' && this.cursor > 0) {
				this.userInput =
					this.userInput.substr(0, this.cursor - 1) + this.userInput.substr(this.cursor);
				this._cursor--;
				return;
			}
			if (key?.name === 'delete' && this.cursor < this.userInput.length) {
				this.value = this.userInput.substr(0, this.cursor) + this.userInput.substr(this.cursor + 1);
				return;
			}
			if (char) {
				this.insertAtCursor(char ?? '');
				this._cursor++;
			}
		});
		this.on('finalize', () => {
			if (!this.value) {
				this.value = opts.defaultValue;
			}
		});
	}
}
