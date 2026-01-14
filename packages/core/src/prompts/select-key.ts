import Prompt, { type PromptOptions } from './prompt.js';

export interface SelectKeyOptions<T extends { value: string }>
	extends PromptOptions<T['value'], SelectKeyPrompt<T>> {
	options: T[];
	caseSensitive?: boolean;
}
export default class SelectKeyPrompt<T extends { value: string }> extends Prompt<T['value']> {
	options: T[];
	cursor = 0;

	constructor(opts: SelectKeyOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		const caseSensitive = opts.caseSensitive === true;
		const keys = this.options.map(({ value: [initial] }) => {
			return caseSensitive ? initial : initial?.toLowerCase();
		});
		this.cursor = Math.max(keys.indexOf(opts.initialValue), 0);

		this.on('key', (key, keyInfo) => {
			if (!key) {
				return;
			}
			const casedKey = caseSensitive && keyInfo.shift ? key.toUpperCase() : key;
			if (!keys.includes(casedKey)) {
				return;
			}

			const value = this.options.find(({ value: [initial] }) => {
				return caseSensitive ? initial === casedKey : initial?.toLowerCase() === key;
			});
			if (value) {
				this.value = value.value;
				this.state = 'submit';
				this.emit('submit');
			}
		});
	}
}
