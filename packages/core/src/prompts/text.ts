import Prompt, { PromptOptions } from './prompt';
import color from 'picocolors';

export interface TextOptions extends PromptOptions<TextPrompt> {
    placeholder?: string;
}

export default class TextPrompt extends Prompt {
    valueWithCursor = '';
    get cursor() {
        return this._cursor;
    }
    constructor(opts: TextOptions) {
        super(opts);
        
        this.on('finalize', () => {
            this.valueWithCursor = this.value;
        });
        this.on('value', () => {
            if (this.cursor >= this.value.length) {
                this.valueWithCursor = `${this.value}${color.inverse(color.hidden('_'))}`;
            } else {
                const s1 = this.value.slice(0, this.cursor);
                const s2 = this.value.slice(this.cursor);
                this.valueWithCursor = `${s1}${color.inverse(s2[0])}${s2.slice(1)}`
            }
        })
    }
}
