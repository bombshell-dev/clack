import Prompt, { PromptOptions } from './prompt';
import { type FzfResultItem } from 'fzf';

interface SelectOptions<T extends { value: any }> extends PromptOptions<SelectPrompt<T>> {
	options: T[];
	initialValue?: T['value'];
	enableFilter?: boolean;
}
export default class SelectPrompt<T extends { value: any }> extends Prompt {
	originalOptions: T[] = [];
	options: T[];
	cursor: number = 0;

	private get _value() {
		return this.options[this.cursor];
	}

	private changeValue() {
		this.value = this._value.value;
	}

	constructor(opts: SelectOptions<T>) {
		super(opts, false);

		this.originalOptions = this.options = opts.options;
		this.cursor = this.options.findIndex(({ value }) => value === opts.initialValue);
		if (this.cursor === -1) this.cursor = 0;
		this.changeValue();

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
				case 'up':
					this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
					break;
				case 'down':
				case 'right':
					this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
					break;
			}
			this.changeValue();
		});

		// For filter
		this.registerFilterer(this.options.map(({ value }) => value));
		this.on('filter', (filtered: FzfResultItem[]) => {
			this.cursor = 0;
			if (filtered.length) {
				this.options = filtered.map(
					({ item }) => this.originalOptions.find(({ value }) => value === item)!
				);
			} else {
				this.options = [];
			}
		});
		this.on('filterClear', () => {
			this.cursor = 0;
			this.options = this.originalOptions;
		});
	}
}
