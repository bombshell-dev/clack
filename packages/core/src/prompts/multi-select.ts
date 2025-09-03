import { findNextCursor, findPrevCursor } from '../utils/cursor.js';
import Prompt, { type PromptOptions } from './prompt.js';

interface MultiSelectOptions<T extends { value: any; disabled?: boolean }>
	extends PromptOptions<T['value'][], MultiSelectPrompt<T>> {
	options: T[];
	initialValues?: T['value'][];
	required?: boolean;
	cursorAt?: T['value'];
}
export default class MultiSelectPrompt<T extends { value: any; disabled?: boolean }> extends Prompt<
	T['value'][]
> {
	options: T[];
	cursor = 0;

	private get _value(): T['value'] {
		return this.options[this.cursor].value;
	}

	private toggleAll() {
		const allSelected = this.value !== undefined && this.value.length === this.options.length;
		this.value = allSelected ? [] : this.options.filter((v) => !v.disabled).map((v) => v.value);
	}

	private toggleInvert() {
		const value = this.value;
		if (!value) {
			return;
		}
		const notSelected = this.options.filter((v) => !v.disabled && !value.includes(v.value));
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
		const disabledOptions = this.options.filter((option) => option.disabled);
		if (this.options.length === disabledOptions.length) return;
		this.value = [...(opts.initialValues ?? [])];
		const cursor = Math.max(
			this.options.findIndex(({ value }) => value === opts.cursorAt),
			0
		);
		this.cursor = this.options[cursor].disabled ? findNextCursor<T>(
			cursor,
			this.options
		) : cursor;
		this.on('key', (char) => {
			if (char === 'a') {
				this.toggleAll();
			}
			if (char === 'i') {
				this.toggleInvert();
			}
		});

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
				case 'up':
					this.cursor = findPrevCursor<T>(this.cursor, this.options);
					break;
				case 'down':
				case 'right':
					this.cursor = findNextCursor<T>(this.cursor, this.options);
					break;
				case 'space':
					this.toggleValue();
					break;
			}
		});
	}
}
