import color from 'picocolors';
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
			return `${this.masked}${color.inverse(color.hidden('_'))}`;
		}
		const masked = this.masked;
		const s1 = masked.slice(0, this.cursor);
		const s2 = masked.slice(this.cursor);
		return `${s1}${color.inverse(s2[0])}${s2.slice(1)}`;
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
	}
}
