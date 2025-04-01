import color from 'picocolors';
import { type Action, settings } from '../utils/index.js';
import Prompt from './prompt.js';
import type { TextOptions } from './text.js';

export default class MultiLinePrompt extends Prompt {
	get valueWithCursor() {
		if (this.state === 'submit') {
			return this.value;
		}
		if (this.cursor >= this.value.length) {
			return `${this.value}█`;
		}
		const s1 = this.value.slice(0, this.cursor);
		const [s2, ...s3] = this.value.slice(this.cursor);
		return `${s1}${color.inverse(s2)}${s3.join('')}`;
	}
	get cursor() {
		return this._cursor;
	}
	insertAtCursor(char: string) {
		if (!this.value || this.value.length === 0) {
			this.value = char;
			return;
		}
		this.value = this.value.substr(0, this.cursor) + char + this.value.substr(this.cursor);
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
	constructor(opts: TextOptions) {
		super(opts, false);

		this.on('rawKey', (char, key) => {
			if (settings.actions.has(key?.name)) {
				this.handleCursor(key?.name);
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
				this.value = this.value.substr(0, this.cursor - 1) + this.value.substr(this.cursor);
				this._cursor--;
				return;
			}
			if (key?.name === 'delete' && this.cursor < this.value.length) {
				this.value = this.value.substr(0, this.cursor) + this.value.substr(this.cursor + 1);
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
