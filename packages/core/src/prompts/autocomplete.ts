import type { Key } from 'node:readline';
import color from 'picocolors';
import Prompt, { type PromptOptions } from './prompt.js';

interface OptionLike {
	value: unknown;
	label?: string;
}

type FilterFunction<T extends OptionLike> = (search: string, opt: T) => boolean;

function getCursorForValue<T extends OptionLike>(
	selected: T['value'] | undefined,
	items: T[]
): number {
	if (selected === undefined) {
		return 0;
	}

	const currLength = items.length;

	// If filtering changed the available options, update cursor
	if (currLength === 0) {
		return 0;
	}

	// Try to maintain the same selected item
	const index = items.findIndex((item) => item.value === selected);
	return index !== -1 ? index : 0;
}

function defaultFilter<T extends OptionLike>(input: string, option: T): boolean {
	const label = option.label ?? String(option.value);
	return label.toLowerCase().includes(input.toLowerCase());
}

function normalisedValue<T>(multiple: boolean, values: T[] | undefined): T | T[] | undefined {
	if (!values) {
		return undefined;
	}
	if (multiple) {
		return values;
	}
	return values[0];
}

interface AutocompleteOptions<T extends OptionLike> extends PromptOptions<AutocompletePrompt<T>> {
	options: T[] | ((this: AutocompletePrompt<T>) => T[]);
	filter?: FilterFunction<T>;
	multiple?: boolean;
}

export default class AutocompletePrompt<T extends OptionLike> extends Prompt {
	filteredOptions: T[];
	multiple: boolean;
	isNavigating = false;
	selectedValues: Array<T['value']> = [];

	focusedValue: T['value'] | undefined;
	#cursor = 0;
	#lastValue: T['value'] | undefined;
	#filterFn: FilterFunction<T>;
	#options: T[] | (() => T[]);

	get cursor(): number {
		return this.#cursor;
	}

	get valueWithCursor() {
		if (!this.value) {
			return color.inverse(color.hidden('_'));
		}
		if (this._cursor >= this.value.length) {
			return `${this.value}█`;
		}
		const s1 = this.value.slice(0, this._cursor);
		const [s2, ...s3] = this.value.slice(this._cursor);
		return `${s1}${color.inverse(s2)}${s3.join('')}`;
	}

	get options(): T[] {
		if (typeof this.#options === 'function') {
			return this.#options();
		}
		return this.#options;
	}

	constructor(opts: AutocompleteOptions<T>) {
		super(opts);

		this.#options = opts.options;
		const options = this.options;
		this.filteredOptions = [...options];
		this.multiple = opts.multiple === true;
		this._usePlaceholderAsValue = false;
		this.#filterFn = opts.filter ?? defaultFilter;
		let initialValues: unknown[] | undefined;
		if (opts.initialValue && Array.isArray(opts.initialValue)) {
			if (this.multiple) {
				initialValues = opts.initialValue;
			} else {
				initialValues = opts.initialValue.slice(0, 1);
			}
		}

		if (initialValues) {
			for (const selectedValue of initialValues) {
				const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);
				if (selectedIndex !== -1) {
					this.toggleSelected(selectedValue);
					this.#cursor = selectedIndex;
					this.focusedValue = options[this.#cursor]?.value;
				}
			}
		}

		this.on('finalize', () => {
			if (!this.value) {
				this.value = normalisedValue(this.multiple, initialValues);
			}

			if (this.state === 'submit') {
				this.value = normalisedValue(this.multiple, this.selectedValues);
			}
		});

		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('value', (value) => this.#onValueChanged(value));
	}

	protected override _isActionKey(char: string | undefined, key: Key): boolean {
		return (
			char === '\t' ||
			(this.multiple &&
				this.isNavigating &&
				key.name === 'space' &&
				char !== undefined &&
				char !== '')
		);
	}

	#onKey(_char: string | undefined, key: Key): void {
		const isUpKey = key.name === 'up';
		const isDownKey = key.name === 'down';

		// Start navigation mode with up/down arrows
		if (isUpKey || isDownKey) {
			this.#cursor = Math.max(
				0,
				Math.min(this.#cursor + (isUpKey ? -1 : 1), this.filteredOptions.length - 1)
			);
			this.focusedValue = this.filteredOptions[this.#cursor]?.value;
			if (!this.multiple) {
				this.selectedValues = [this.focusedValue];
			}
			this.isNavigating = true;
		} else {
			if (
				this.multiple &&
				this.focusedValue !== undefined &&
				(key.name === 'tab' || (this.isNavigating && key.name === 'space'))
			) {
				this.toggleSelected(this.focusedValue);
			} else {
				this.isNavigating = false;
			}
		}
	}

	toggleSelected(value: T['value']) {
		if (this.filteredOptions.length === 0) {
			return;
		}

		if (this.multiple) {
			if (this.selectedValues.includes(value)) {
				this.selectedValues = this.selectedValues.filter((v) => v !== value);
			} else {
				this.selectedValues = [...this.selectedValues, value];
			}
		} else {
			this.selectedValues = [value];
		}
	}

	#onValueChanged(value: unknown): void {
		if (typeof value !== 'string') {
			return;
		}
		const options = this.options;
		if (value !== this.#lastValue) {
			this.#lastValue = value;

			if (value) {
				this.filteredOptions = options.filter((opt) => this.#filterFn(value, opt));
			} else {
				this.filteredOptions = [...options];
			}
			this.#cursor = getCursorForValue(this.focusedValue, this.filteredOptions);
			this.focusedValue = this.filteredOptions[this.#cursor]?.value;
		}
	}
}
