import color from 'picocolors';
import Prompt, { type PromptOptions } from './prompt.js';

interface PasswordOptions extends PromptOptions<PasswordPrompt> {
	mask?: string;
}
export default class PasswordPrompt extends Prompt {
	private _mask = '•';
	get cursor() {
		return this._cursor;
	}
	get masked() {
		return this.value?.replaceAll(/./g, this._mask) ?? '';
	}
	get valueWithCursor() {
		if (this.state === 'submit' || this.state === 'cancel') {
			return this.masked;
		}
		const value = this.value ?? '';
		if (this.cursor >= value.length) {
			return `${this.masked}${color.inverse(color.hidden('_'))}`;
		}
		const s1 = this.masked.slice(0, this.cursor);
		const s2 = this.masked.slice(this.cursor);
		return `${s1}${color.inverse(s2[0])}${s2.slice(1)}`;
	}
	constructor({ mask, ...opts }: PasswordOptions) {
		super(opts);
		this._mask = mask ?? '•';
	}
}
