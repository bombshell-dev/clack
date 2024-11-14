import fuzzy from 'fuzzy';
import Prompt, { PromptOptions } from './prompt';
interface SearchOptions<T extends { value: any; label?: string }, MaxItems extends number>
	extends PromptOptions<SearchPrompt<T, MaxItems>> {
	options: T[];
	initialValue?: T['value'];
	maxItems?: MaxItems;
}
export default class SearchPrompt<
	T extends { value: any; label?: string; isSelected?: boolean },
	MaxItems extends number,
> extends Prompt {
	options: T[];
	valueWithCursor = '';

	selectCursor = 0;
	inputCursor = 0;
	maxItems: MaxItems;
	selected: T[] = [];

	value: T['value'] | T['value'][] = '';
	private get _value() {
		return this.options[this.selectCursor];
	}

	private changeValue() {
		this.value = this._value?.value;
	}

	constructor(opts: SearchOptions<T, any>) {
		super(opts, false);
		this.options = opts.options;
		this.maxItems = opts.maxItems || 1;
		this.valueWithCursor = opts.initialValue || '';
		if (this.valueWithCursor) {
			this.inputCursor = this.valueWithCursor.length;
			this.fuzzyFilter(opts);
		}

		this.on('key', (v) => {
			if (v.charCodeAt(0) === 127) {
				this.valueWithCursor =
					this.valueWithCursor.slice(0, this.inputCursor - 1) +
					this.valueWithCursor.slice(this.inputCursor);
				this.inputCursor = this.inputCursor === 0 ? 0 : this.inputCursor - 1;
				this.selectCursor = 0;
			} else if (v.charCodeAt(0) === 8) {
				this.valueWithCursor =
					this.valueWithCursor.slice(0, this.inputCursor) +
					this.valueWithCursor.slice(this.inputCursor + 1);
				this.selectCursor = 0;
			} else if (v.charCodeAt(0) === 13 || v.charCodeAt(0) === 3) {
				return;
			} else if ((this.maxItems > 1 && v.charCodeAt(0) === 32) || v.charCodeAt(0) === 9) {
				const value = this.options[this.selectCursor];
				if (this.selected.includes(value)) {
					this.selected = this.selected.filter((v) => v !== value);
				} else {
					this.selected.push(value);
				}
			} else {
				this.valueWithCursor =
					this.valueWithCursor.slice(0, this.inputCursor) +
					v +
					this.valueWithCursor.slice(this.inputCursor);
				this.inputCursor = this.inputCursor + 1;
				this.selectCursor = 0;
			}
			this.fuzzyFilter(opts);
		});

		this.on('finalize', () => {
			this.value = this.selected.length
				? this.selected.map((item) => item.value)
				: this.maxItems > 1
					? [this.options[this.selectCursor].value]
					: this.options[this.selectCursor].value;
		});

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
					this.inputCursor = Math.max(0, this.inputCursor - 1);
					break;
				case 'up':
					this.selectCursor =
						this.selectCursor === 0 ? this.options.length - 1 : this.selectCursor - 1;
					break;
				case 'down':
					this.selectCursor =
						this.selectCursor === this.options.length - 1 ? 0 : this.selectCursor + 1;
					break;
				case 'right':
					this.inputCursor = Math.min(this.valueWithCursor.length, this.inputCursor + 1);
					break;
			}
			this.changeValue();
		});
	}
	fuzzyFilter(opts: SearchOptions<T, MaxItems>) {
		const fuzzyOptions = fuzzy.filter(this.valueWithCursor, opts.options, {
			extract: ({ label, value }) => label || value,
		});
		fuzzyOptions.sort((a, b) => {
			if (a.index === b.index) {
				return (
					(a.original.label || a.original.value).indexOf(this.valueWithCursor) -
					(b.original.label || b.original.value).indexOf(this.valueWithCursor)
				);
			}
			return a.index - b.index;
		});
		this.options = fuzzyOptions.map((item) => item.original);
		this.changeValue();
	}
}
