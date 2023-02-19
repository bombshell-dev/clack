import Prompt, { PromptOptions } from './prompt';

interface MultiSelectOptions<T extends { value: any }> extends PromptOptions<MultiSelectPrompt<T>> {
	options: T[];
	initialValue?: T['value'][];
	required?: boolean;
	cursorAt?: T['value'];
}
export default class MultiSelectPrompt<T extends { value: any }> extends Prompt {
	options: T[];
	cursor: number = 0;

	private get _value() {
		return this.options[this.cursor];
	}

	private toggleValue() {
		this.value = this.value.some(({ value }: T) => value === this._value.value)
			? this.value.filter(({ value }: T) => value !== this._value.value)
			: [...this.value, this._value];
	}

	constructor(opts: MultiSelectOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		this.value = this.options.filter(({ value }) => opts.initialValue?.includes(value));
		this.cursor = Math.max(
			this.options.findIndex(({ value }) => value === opts.cursorAt),
			0
		);

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
				case 'space':
					this.toggleValue();
					break;
			}
		});
	}
}
