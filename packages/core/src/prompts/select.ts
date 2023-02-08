import Prompt, { PromptOptions } from './prompt.js';

interface SelectOptions<T extends { value: any }> extends PromptOptions<SelectPrompt<T>> {
    options: T[]
    initialValue?: T['value'];
}
export default class SelectPrompt<T extends { value: any }> extends Prompt {
    options: T[];
    cursor: number = 0;

    private get _value() {
        return this.options[this.cursor]
    }

    constructor(opts: SelectOptions<T>) {
        super(opts);
        
        this.options = opts.options;
        this.cursor = this.options.findIndex(({ value }) => value === opts.initialValue);
        if (this.cursor === -1) this.cursor = 0;
        this.on('value', () => {
            this.value = this._value.value;
        })
        
        this.on('cursor', (key) => {
            switch (key) {
                case 'left': 
                case 'up': 
                    return this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
                case 'down': 
                case 'right':
                    return this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
            }
        })
    }
}
