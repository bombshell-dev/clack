import { styleText } from 'node:util';
import Prompt, { type PromptOptions } from './prompt.js';

export interface TextOptions extends PromptOptions<string, TextPrompt> {
	placeholder?: string;
	defaultValue?: string;
}

export default class TextPrompt extends Prompt<string> {
	get userInputWithCursor() {
		if (this.state === 'submit') {
			return this.userInput;
		}
		const userInput = this.userInput;
		if (this.cursor >= userInput.length) {
			return `${this.userInput}█`;
		}
		const preCursor = userInput.slice(0, this.cursor);
		const cursorChar = userInput.slice(this.cursor, this.cursor + 1);
		const rest = userInput.slice(this.cursor + 1);
		return `${preCursor}${styleText('inverse', cursorChar)}${rest}`;
	}
	get cursor() {
		return this._cursor;
	}
	constructor(opts: TextOptions) {
		super({
			...opts,
			initialUserInput: opts.initialUserInput ?? opts.initialValue,
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
