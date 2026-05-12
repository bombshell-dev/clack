import { findCursor } from '../utils/cursor.js';
import Prompt, { type PromptOptions } from './prompt.js';

export interface SelectOptions<T extends { value: any; disabled?: boolean }>
	extends PromptOptions<T['value'], SelectPrompt<T>> {
	options: T[];
	initialValue?: T['value'];
}
export default class SelectPrompt<T extends { value: any; disabled?: boolean }> extends Prompt<
	T['value']
> {
	options: T[];
	cursor = 0;

	private get _selectedValue() {
		return this.options[this.cursor];
	}

	private changeValue() {
		this.value = this._selectedValue.value;
	}

	constructor(opts: SelectOptions<T>) {
		super(opts, false);

		this.options = opts.options;

		const initialCursor = this.options.findIndex(({ value }) => value === opts.initialValue);
		const cursor = initialCursor === -1 ? 0 : initialCursor;
		this.cursor = this.options[cursor].disabled ? findCursor<T>(cursor, 1, this.options) : cursor;
		this.changeValue();

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
			}
			this.changeValue();
		});

		this.on('key', (char, key) => {
			if (key.ctrl || key.meta) return;
			if (!char || char.length !== 1) return;
			if (char < '1' || char > '9') return;
			const target = Number(char) - 1;
			if (target >= this.options.length) return;
			this.cursor = this.options[target].disabled ? findCursor<T>(target, 1, this.options) : target;
			this.changeValue();
		});
	}
}
