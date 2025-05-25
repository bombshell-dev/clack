import type { ValueWithCursorPart } from '../types.js';
import Prompt, { type PromptOptions } from './prompt.js';

interface SuggestionOptions extends PromptOptions<string, SuggestionPrompt> {
	suggest: (value: string) => Array<string>;
	initialValue: string;
}

export default class SuggestionPrompt extends Prompt<string> {
	protected suggest: (value: string) => Array<string>;
	private selectionIndex = 0;
	private nextItems: Array<string> = [];

	constructor(opts: SuggestionOptions) {
		super(opts);

		this.value = opts.initialValue;
		this.suggest = opts.suggest;
		this.getNextItems();
		this.selectionIndex = 0;
		this._cursor = this.value.length;

		this.on('cursor', (key) => {
			switch (key) {
				case 'up':
					this.selectionIndex = Math.max(
						0,
						this.selectionIndex === 0 ? this.nextItems.length - 1 : this.selectionIndex - 1
					);
					break;
				case 'down':
					this.selectionIndex =
						this.nextItems.length === 0 ? 0 : (this.selectionIndex + 1) % this.nextItems.length;
					break;
			}
		});
		this.on('key', (_key, info) => {
			if (info.name === 'tab' && this.nextItems.length > 0) {
				const delta = this.nextItems[this.selectionIndex].substring(this.userInput.length);
				this.value = this.nextItems[this.selectionIndex];
				this.rl?.write(delta);
				this._cursor = this.value.length;
				this.selectionIndex = 0;
				this.getNextItems();
			}
		});
		this.on('value', () => {
			this.getNextItems();
		});
	}

	get displayValue(): Array<ValueWithCursorPart> {
		const result: Array<ValueWithCursorPart> = [];
		if (this._cursor > 0) {
			result.push({
				text: this.userInput.substring(0, this._cursor),
				type: 'value',
			});
		}
		if (this._cursor < this.userInput.length) {
			result.push({
				text: this.userInput.substring(this._cursor, this._cursor + 1),
				type: 'cursor_on_value',
			});
			const left = this.userInput.substring(this._cursor + 1);
			if (left.length > 0) {
				result.push({
					text: left,
					type: 'value',
				});
			}
			if (this.suggestion.length > 0) {
				result.push({
					text: this.suggestion,
					type: 'suggestion',
				});
			}
			return result;
		}
		if (this.suggestion.length === 0) {
			result.push({
				text: '\u00A0',
				type: 'cursor_on_value',
			});
			return result;
		}
		result.push(
			{
				text: this.suggestion[0],
				type: 'cursor_on_suggestion',
			},
			{
				text: this.suggestion.substring(1),
				type: 'suggestion',
			}
		);
		return result;
	}

	get suggestion(): string {
		return this.nextItems[this.selectionIndex]?.substring(this.userInput.length) ?? '';
	}

	private getNextItems(): void {
		this.nextItems = this.suggest(this.userInput).filter((item) => {
			return item.startsWith(this.userInput) && item !== this.value;
		});
		if (this.selectionIndex > this.nextItems.length) {
			this.selectionIndex = 0;
		}
	}
}
