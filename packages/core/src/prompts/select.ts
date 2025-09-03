import { findNextCursor, findPrevCursor } from '../utils/cursor.js';
import Prompt, { type PromptOptions } from './prompt.js';

interface SelectOptions<T extends { value: any; disabled?: boolean }>
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
		const disabledOptions = this.options.filter((option) => option.disabled);
		if (this.options.length === disabledOptions.length) return;

		const initialCursor = this.options.findIndex(({ value }) => value === opts.initialValue);
		const cursor = initialCursor === -1 ? 0 : initialCursor
		this.cursor = this.options[cursor].disabled ? findNextCursor<T>(cursor, this.options) : cursor;
		this.changeValue();

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
			}
			this.changeValue();
		});
	}
}
