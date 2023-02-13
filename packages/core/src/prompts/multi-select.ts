import Prompt, { PromptOptions } from './prompt.js';

interface MultiSelectOptions<T extends { value: any }> extends PromptOptions<MultiSelectPrompt<T>> {
    options: T[];
    initialValue?: T['value'];
}
export default class MultiSelectPrompt<T extends { value: any }> extends Prompt {
    options: T[];
    cursor: number = 0;
    selectedValues: T[];

    private get _value() {
        return this.options[this.cursor]
    }

    private changeValue() {
        const isValueAlreadySelected = this.selectedValues.some(value => value === this._value.value);
        if(isValueAlreadySelected) {
            this.selectedValues = this.selectedValues.filter(value => value !== this._value.value)
        } else {
            this.selectedValues.push(this._value.value);
        }
    }

    constructor(opts: MultiSelectOptions<T>) {
        super(opts, false);
        
        this.options = opts.options;
        this.cursor = this.options.findIndex(({ value }) => value === opts.initialValue);
        this.selectedValues = []
        if (this.cursor === -1) this.cursor = 0;
        
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
                    this.changeValue();
                    break;
                case 'enter':
                    this.state = 'submit';
                    this.close();
                    break;
            }
        })
    }
}
