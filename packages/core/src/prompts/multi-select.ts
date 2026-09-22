import { findCursor } from '../utils/cursor.js';
import Prompt, { type PromptOptions } from './prompt.js';

interface OptionLike {
	value: any;
	disabled?: boolean;
}

export interface MultiSelectOptions<T extends OptionLike>
	extends PromptOptions<T['value'][], MultiSelectPrompt<T>> {
	options: T[];
	initialValues?: T['value'][];
	required?: boolean;
	cursorAt?: T['value'];
}
export default class MultiSelectPrompt<T extends OptionLike> extends Prompt<T['value'][]> {
	options: T[];
	cursor = 0;

	private get _value(): T['value'] {
		return this.options[this.cursor]?.value;
	}

	private get _enabledOptions(): T[] {
		return this.options.filter((option) => option.disabled !== true);
	}

	private toggleAll() {
		const enabledOptions = this._enabledOptions;
		const allSelected = this.value !== undefined && this.value.length === enabledOptions.length;
		this.value = allSelected ? [] : enabledOptions.map((v) => v.value);
	}

	private toggleInvert() {
		const value = this.value;
		if (!value) {
			return;
		}
		const notSelected = this._enabledOptions.filter((v) => !value.includes(v.value));
		this.value = notSelected.map((v) => v.value);
	}

	private toggleValue() {
		if (this.value === undefined) {
			this.value = [];
		}
		const selected = this.value.includes(this._value);
		this.value = selected
			? this.value.filter((value) => value !== this._value)
			: [...this.value, this._value];
	}

	constructor(opts: MultiSelectOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		this.value = [...(opts.initialValues ?? [])];
		const cursor = Math.max(
			this.options.findIndex(({ value }) => value === opts.cursorAt),
			0
		);
		this.cursor = this.options[cursor]?.disabled ? findCursor<T>(cursor, 1, this.options) : cursor;
		this.on('key', (char, key) => {
			if (key.name === 'a') {
				this.toggleAll();
			}
			if (key.name === 'i') {
				this.toggleInvert();
			}
			// Some IMEs (e.g. Japanese or Chinese input) commit an ideographic space (U+3000)
			// with no key name when the space key is pressed. Treat it as space so
			// toggling options still works.
			if (key.name === undefined && char === '　') {
				this.toggleValue();
			}
		});

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
				case 'up':
					this.cursor = findCursor<T>(this.cursor, -1, this.options);
					break;
				case 'down':
				case 'right':
					this.cursor = findCursor<T>(this.cursor, 1, this.options);
					break;
				case 'space':
					this.toggleValue();
					break;
			}
		});
	}
}
