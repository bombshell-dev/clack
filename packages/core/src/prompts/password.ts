import { styleText } from 'node:util';
import Prompt, { type PromptOptions } from './prompt.js';

export interface PasswordOptions extends PromptOptions<string, PasswordPrompt> {
	mask?: string;
}
export default class PasswordPrompt extends Prompt<string> {
	private _mask = '•';
	get cursor() {
		return this._cursor;
	}
	get masked() {
		return this.userInput.replaceAll(/./g, this._mask);
	}
	get userInputWithCursor() {
		if (this.state === 'submit' || this.state === 'cancel') {
			return this.masked;
		}
		const userInput = this.userInput;
		if (this.cursor >= userInput.length) {
			return `${this.masked}${styleText(['inverse', 'hidden'], '_')}`;
		}
		const masked = this.masked;
		const preCursor = masked.slice(0, this.cursor);
		const cursorChar = masked.slice(this.cursor, this.cursor + 1);
		const rest = masked.slice(this.cursor + 1);
		return `${preCursor}${styleText('inverse', cursorChar)}${rest}`;
	}
	clear() {
		this._clearUserInput();
	}
	constructor({ mask, ...opts }: PasswordOptions) {
		super(opts);
		this._mask = mask ?? '•';
		this.on('userInput', (input) => {
			this._setValue(input);
		});
		this.on('finalize', () => {
			if (this.value === undefined) {
				this.value = '';
			}
		});
	}
}
