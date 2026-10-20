import Prompt, { type PromptOptions } from './prompt.js';

export interface SelectKeyOptions<T extends { value: string; disabled?: boolean }>
	extends PromptOptions<T['value'], SelectKeyPrompt<T>> {
	options: T[];
	caseSensitive?: boolean;
}
export default class SelectKeyPrompt<
	T extends { value: string; disabled?: boolean },
> extends Prompt<T['value']> {
	options: T[];
	cursor = 0;

	constructor(opts: SelectKeyOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		const caseSensitive = opts.caseSensitive === true;
		const keys = this.options.map(({ value: [initial] }) => {
			return caseSensitive ? initial : initial?.toLowerCase();
		});
		const cursor = Math.max(keys.indexOf(opts.initialValue), 0);
		this.cursor = this.options[cursor]?.disabled ? 0 : cursor;

		this.on('key', (key) => {
			if (!key) {
				return;
			}
			const casedKey = caseSensitive ? key : key.toLowerCase();
			if (!keys.includes(casedKey)) {
				return;
			}

			const value = this.options.find(({ value: [initial], disabled }) => {
				if (disabled) {
					return false;
				}
				return caseSensitive ? initial === casedKey : initial?.toLowerCase() === casedKey;
			});
			if (value) {
				this.value = value.value;
				this.state = 'submit';
				this.emit('submit');
			}
		});
	}
}
