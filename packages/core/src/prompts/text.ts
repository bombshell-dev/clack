import color from 'picocolors';
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
		const s1 = userInput.slice(0, this.cursor);
		const [s2, ...s3] = userInput.slice(this.cursor);
		return `${s1}${color.inverse(s2)}${s3.join('')}`;
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
