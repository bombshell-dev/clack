import color from 'picocolors';
import Prompt, { type PromptOptions } from './prompt.js';

interface TextOptions extends PromptOptions<TextPrompt> {
	placeholder?: string;
	defaultValue?: string;
}

export default class TextPrompt extends Prompt {
	get valueWithCursor() {
		if (this.state === 'submit') {
			return this.value;
		}
		const value = this.value ?? '';
		if (this.cursor >= value.length) {
			return `${this.value}█`;
		}
		const s1 = value.slice(0, this.cursor);
		const [s2, ...s3] = value.slice(this.cursor);
		return `${s1}${color.inverse(s2)}${s3.join('')}`;
	}
	get cursor() {
		return this._cursor;
	}
	constructor(opts: TextOptions) {
		super(opts);

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
