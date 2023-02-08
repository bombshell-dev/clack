import Prompt, { PromptOptions } from './prompt.js';

interface SelectOptions<T extends any> extends PromptOptions<SelectPrompt<T>> {
    options: T[]
    initialIndex?: number;
}
export default class SelectPrompt<T extends any> extends Prompt {
    options: T[];
    cursor: number = 0;

    private get _value() {
        return this.options[this.cursor]
    }

    constructor(opts: SelectOptions<T>) {
        super(opts);
        
        this.options = opts.options;
        this.cursor = opts.initialIndex ?? 0;
        this.on('value', () => {
            this.value = this._value;
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
