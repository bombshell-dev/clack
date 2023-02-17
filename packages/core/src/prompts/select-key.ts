import Prompt, { PromptOptions } from './prompt';

interface SelectKeyOptions<T extends { value: any }> extends PromptOptions<SelectKeyPrompt<T>> {
	options: T[];
}
export default class SelectKeyPrompt<T extends { value: any }> extends Prompt {
	options: T[];
	cursor: number = 0;

	constructor(opts: SelectKeyOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		const keys = opts.options.map(v => v.value[0]);

		this.on('key', (key) => {
			if (!keys.includes(key)) return;
			const value = opts.options.find(v => v.value[0] === key);
			if (value) {
				this.value = value.value;
				this.state = 'submit';
				this.emit('submit');
			}
		});
	}
}
