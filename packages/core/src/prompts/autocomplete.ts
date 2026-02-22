import type { Key } from 'node:readline';
import color from 'picocolors';
import { findCursor } from '../utils/cursor.js';
import { isAsync } from '../utils/index.js';
import Prompt, { type PromptOptions } from './prompt.js';

interface OptionLike {
	value: unknown;
	label?: string;
	disabled?: boolean;
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

function isAsyncOptions<T extends OptionLike>(
	options: AutocompleteOptions<T>['options']
): options is AutocompleteOptionsAsync<T>['options'] {
	return isAsync({ options }, 'options');
}

interface AutocompleteOptionsSync<T extends OptionLike> {
	options: T[] | ((this: AutocompletePrompt<T>) => T[]);
	filter?: FilterFunction<T>;
}
interface AutocompleteOptionsAsync<T extends OptionLike> {
	options: (this: AutocompletePrompt<T>, signal?: AbortSignal) => Promise<T[]>;
	interval: number;
	frameCount: number;
	debounce?: number;
	filter?: FilterFunction<T> | null;
}

export type AutocompleteOptions<T extends OptionLike> = PromptOptions<
	T['value'] | T['value'][],
	AutocompletePrompt<T>
> & {
	multiple?: boolean;
} & (AutocompleteOptionsSync<T> | AutocompleteOptionsAsync<T>);

export default class AutocompletePrompt<T extends OptionLike> extends Prompt<
	T['value'] | T['value'][]
> {
	options: T[] = [];
	filteredOptions: T[] = [];
	multiple: boolean;
	isNavigating = false;
	selectedValues: Array<T['value']> = [];

	focusedValue: T['value'] | undefined;

	isLoading = false;
	spinnerIndex = 0;
	#spinnerFrameCount: number = 0;
	#spinnerInterval?: number;
	#spinnerTimer?: NodeJS.Timeout;

	#debounceMs?: number;
	#debounceTimer?: NodeJS.Timeout;
	#abortController?: AbortController;

	#cursor = 0;
	#lastUserInput = '';
	#filterFn: FilterFunction<T> | null;
	#options: AutocompleteOptions<T>['options'];

	get cursor(): number {
		return this.#cursor;
	}

	get userInputWithCursor() {
		if (!this.userInput) {
			return color.inverse(color.hidden('_'));
		}
		if (this._cursor >= this.userInput.length) {
			return `${this.userInput}█`;
		}
		const s1 = this.userInput.slice(0, this._cursor);
		const [s2, ...s3] = this.userInput.slice(this._cursor);
		return `${s1}${color.inverse(s2)}${s3.join('')}`;
	}

	constructor(opts: AutocompleteOptions<T>) {
		super(opts);

		this.#options = opts.options;
		this.multiple = opts.multiple === true;
		this.#filterFn = opts.filter === undefined ? defaultFilter : opts.filter;

		if (isAsync<AutocompleteOptionsSync<T>, AutocompleteOptionsAsync<T>>(opts, 'options')) {
			this.#debounceMs = opts.debounce ?? 300;
			this.#spinnerInterval = opts.interval;
			this.#spinnerFrameCount = opts.frameCount;
		}

		const optionsProcessing = () => {
			this.filteredOptions = [...this.options];

			let initialValues: unknown[] | undefined;
			if (opts.initialValue && Array.isArray(opts.initialValue)) {
				if (this.multiple) {
					initialValues = opts.initialValue;
				} else {
					initialValues = opts.initialValue.slice(0, 1);
				}
			} else {
				if (!this.multiple && this.options.length > 0) {
					initialValues = [this.options[0].value];
				}
			}

			if (initialValues) {
				for (const selectedValue of initialValues) {
					const selectedIndex = this.options.findIndex((opt) => opt.value === selectedValue);
					if (selectedIndex !== -1) {
						this.toggleSelected(selectedValue);
						this.#cursor = selectedIndex;
					}
				}
			}

			this.focusedValue = this.options[this.#cursor]?.value;
		};

		this.#populateOptions(optionsProcessing);

		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('userInput', (value) => this.#onUserInputChanged(value));
		this.on('finalize', () => this.#setLoading(false));
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

	async #populateOptions(runnable?: () => void) {
		if (isAsyncOptions(this.#options)) {
			this.#setLoading(true);

			// Allows aborting the previous async options call if the user
			// made a new search before getting results from the previous one.
			if (this.#abortController) {
				this.#abortController.abort();
			}

			const abortController = new AbortController();
			this.#abortController = abortController;
			const options = await this.#options(abortController.signal);

			// Don't do anything else if there was a new search done.
			// This works because abortController will still have the old instance
			if (this.#abortController !== abortController) {
				return;
			}

			this.options = options;
			this.#setLoading(false);
			this.#abortController = undefined;

			runnable?.();
			this.render();
			return;
		}

		if (typeof this.#options === 'function') {
			this.options = this.#options();
		} else {
			this.options = this.#options;
		}

		runnable?.();
	}

	#setLoading(loading: boolean) {
		this.isLoading = loading;

		if (!loading) {
			if (this.#spinnerTimer) {
				clearInterval(this.#spinnerTimer);
				this.#spinnerTimer = undefined;
			}
			return;
		}

		if (!this.#spinnerTimer) {
			this.spinnerIndex = 0;

			this.#spinnerTimer = setInterval(() => {
				this.spinnerIndex = (this.spinnerIndex + 1) % this.#spinnerFrameCount;
				this.render();
			}, this.#spinnerInterval);

			this.render();
		}
	}

	#onKey(_char: string | undefined, key: Key): void {
		const isUpKey = key.name === 'up';
		const isDownKey = key.name === 'down';
		const isReturnKey = key.name === 'return';

		// Start navigation mode with up/down arrows
		if (isUpKey || isDownKey) {
			this.#cursor = findCursor(this.#cursor, isUpKey ? -1 : 1, this.filteredOptions);
			this.focusedValue = this.filteredOptions[this.#cursor]?.value;
			if (!this.multiple) {
				this.selectedValues = [this.focusedValue];
			}
			this.isNavigating = true;
		} else if (isReturnKey) {
			this.value = normalisedValue(this.multiple, this.selectedValues);
		} else {
			if (this.multiple) {
				if (
					this.focusedValue !== undefined &&
					(key.name === 'tab' || (this.isNavigating && key.name === 'space'))
				) {
					this.toggleSelected(this.focusedValue);
				} else {
					this.isNavigating = false;
				}
			} else {
				if (this.focusedValue) {
					this.selectedValues = [this.focusedValue];
				}
				this.isNavigating = false;
			}
		}
	}

	deselectAll() {
		this.selectedValues = [];
	}

	toggleSelected(value: T['value']) {
		if (this.filteredOptions.length === 0) {
			return;
		}

		if (!this.multiple) {
			this.selectedValues = [value];
			return;
		}

		if (this.selectedValues.includes(value)) {
			this.selectedValues = this.selectedValues.filter((v) => v !== value);
		} else {
			this.selectedValues = [...this.selectedValues, value];
		}
	}

	#onUserInputChanged(value: string): void {
		if (value === this.#lastUserInput) {
			return;
		}

		this.#lastUserInput = value;

		if (isAsyncOptions(this.#options)) {
			this.#handleInputChangedAsync(value);
		} else {
			this.#handleInputChangedSync(value);
		}
	}

	#handleInputChangedSync(value: string) {
		const optionsProcessing = () => {
			if (value && this.#filterFn !== null) {
				const filterFn = this.#filterFn;
				this.filteredOptions = this.options.filter((opt) => filterFn(value, opt));
			} else {
				this.filteredOptions = [...this.options];
			}

			const valueCursor = getCursorForValue(this.focusedValue, this.filteredOptions);
			this.#cursor = findCursor(valueCursor, 0, this.filteredOptions);
			const focusedOption = this.filteredOptions[this.#cursor];
			if (focusedOption && !focusedOption.disabled) {
				this.focusedValue = focusedOption.value;
			} else {
				this.focusedValue = undefined;
			}
			if (!this.multiple) {
				if (this.focusedValue !== undefined) {
					this.toggleSelected(this.focusedValue);
				} else {
					this.deselectAll();
				}
			}
		};

		this.#populateOptions(optionsProcessing);
	}

	#handleInputChangedAsync(value: string) {
		// Clear previous debounce timer
		if (this.#debounceTimer) {
			clearTimeout(this.#debounceTimer);
		}

		this.#debounceTimer = setTimeout(() => {
			this.#handleInputChangedSync(value);
		}, this.#debounceMs);
	}
}
