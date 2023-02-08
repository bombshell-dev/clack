import Prompt, { PromptOptions } from './prompt.js';


interface ConfirmOptions<T extends { value: boolean }> extends PromptOptions<ConfirmPrompt<T>> {
    options: T[];
    initialValue?: boolean;
}
export default class ConfirmPrompt<T extends { value: boolean }> extends Prompt {
    options: T[];
    cursor: number = 0;

    private get _value() {
        return this.options[this.cursor]
    }

    constructor(opts: ConfirmOptions<T>) {
        super(opts);
        
        this.options = opts.options;
        this.cursor = this.options.findIndex(({ value }) => value === opts.initialValue);
        if (this.cursor === -1) this.cursor = 0;
        
        this.on('value', () => {
            this.value = this._value.value;
        })

        this.on('confirm', (confirm) => {
            this.cursor = this.options.findIndex(({ value }) => value === confirm);
            if (this.cursor === -1) this.cursor = 0;
            this.value = confirm;
            this.state = 'submit';
            this.close()
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
