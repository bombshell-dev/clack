import color from 'picocolors';
import { exposeTestUtils } from '../utils';
import Prompt, { PromptOptions } from './prompt';

export interface PasswordOptions extends PromptOptions<PasswordPrompt> {
	mask?: string;
}

export default class PasswordPrompt extends Prompt {
	public valueWithCursor: string;

	private _mask: string;

	get cursor() {
		return this._cursor;
	}

	get maskedValue(): string {
		return this.value.replaceAll(/./g, this._mask);
	}

	constructor({ mask, ...opts }: PasswordOptions) {
		super(opts, true);

		this.value = '';
		this._mask = mask ?? '•';
		this.valueWithCursor = this.maskedValue + color.inverse(color.hidden('_'));

		this.exposeTestUtils();

		this.on('finalize', () => {
			this.valueWithCursor = this.maskedValue;
			this.exposeTestUtils();
		});

		this.on('value', (value) => {
			this.value = value;
			if (this.cursor >= this.value.length) {
				this.valueWithCursor = `${this.maskedValue}${color.inverse(color.hidden('_'))}`;
			} else {
				const s1 = this.maskedValue.slice(0, this.cursor);
				const s2 = this.maskedValue.slice(this.cursor);
				this.valueWithCursor = `${s1}${color.inverse(s2[0])}${s2.slice(1)}`;
			}
			this.exposeTestUtils();
		});
	}

	private exposeTestUtils() {
		exposeTestUtils<PasswordPrompt>({
			cursor: this.cursor,
			maskedValue: this.maskedValue,
			valueWithCursor: this.valueWithCursor,
		});
	}
}
