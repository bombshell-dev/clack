import Prompt, { PromptOptions } from './prompt';
import color from 'picocolors';
import fuzzy from 'fuzzy'
import { SearchPrompt } from '..';
interface SearchOptions<T extends { value: any, label?: string }> extends PromptOptions<SearchPrompt<T>> {
	options: T[];
	initialValue?: T['value'];
	maxItems?: number;
}
export default class SelectPrompt<T extends { value: any, label?: string }> extends Prompt {
	options: T[];
	valueWithCursor = '';

	selectCursor = 0
	inputCursor = 1
	maxItems = 1
	private get _value() {
		return this.options[this.selectCursor];
	}

	private changeValue() {
		this.value = this._value?.value;
	}

	constructor(opts: SearchOptions<T>) {
		super(opts, false);
		this.options = opts.options;

		this.on('key', (v) => {
			if (v.charCodeAt(0) === 127) {
				this.valueWithCursor = this.valueWithCursor.slice(0, this.inputCursor - 1) + this.valueWithCursor.slice(this.inputCursor);
				this.inputCursor = this.inputCursor === 0 ? 0 : this.inputCursor - 1;
				this.selectCursor = 0;
			}
			else if (v.charCodeAt(0) === 8) {
				// 往后删
				this.valueWithCursor = this.valueWithCursor.slice(0, this.inputCursor) + this.valueWithCursor.slice(this.inputCursor + 1);
				this.selectCursor = 0;
			}
			else if ( v.charCodeAt(0) === 13 || v.charCodeAt(0) === 3) {
				return
			}
			else if (this.maxItems > 1 && v.charCodeAt(0) === 32 || v.charCodeAt(0) === 9) {
				// todo: 将当前 options 的 结果 反转,如果是选中,则不选中

			}
			else {
				this.valueWithCursor = this.valueWithCursor.slice(0, this.inputCursor) + v + this.valueWithCursor.slice(this.inputCursor);
				this.inputCursor = this.inputCursor + 1;
				this.selectCursor = 0;
			}
			// 过滤 options
			// todo: 根据搜索命中的 index 再排序
			const fuzzyOptions = fuzzy.filter(this.valueWithCursor, opts.options, { extract: ({ label, value }) => label || value }).map(item => item.original)
			this.options = fuzzyOptions;
			this.changeValue()
		});

		this.on('finalize', () => {
			this.valueWithCursor = this.options[this.selectCursor].value
		});

		this.changeValue();

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
					this.inputCursor = Math.max(0, this.inputCursor - 1);
					break;
				case 'up':
					this.selectCursor = this.selectCursor === 0 ? this.options.length - 1 : this.selectCursor - 1;
					break;
				case 'down':
					this.selectCursor = this.selectCursor === this.options.length - 1 ? 0 : this.selectCursor + 1;
					break
				case 'right':
					this.inputCursor = Math.min(this.valueWithCursor.length, this.inputCursor + 1);
					break;
			}
			this.changeValue();
		});
	}
}
