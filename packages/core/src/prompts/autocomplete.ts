import type { Key } from 'node:readline';
import color from 'picocolors';
import Prompt, { type PromptOptions } from './prompt.js';

interface OptionLike {
	value: unknown;
	label?: string;
}

type FilterFunction<T extends OptionLike> = (search: string, opt: T) => boolean;
type FilteredOptionsFunction<T extends OptionLike> = (
	query: string,
	signal?: AbortSignal
) => T[] | PromiseLike<T[]>;

function isThenable(value: any): value is PromiseLike<any> {
	return value != null && typeof value.then === 'function';
}

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

// Pass an array of options and optional filter function and it will perform filtering automatically
interface AutocompleteUnfilteredOptions<T extends OptionLike>
	extends PromptOptions<T['value'] | T['value'][], AutocompletePrompt<T>> {
	options: T[] | ((this: AutocompletePrompt<T>) => T[]);
	filter?: FilterFunction<T>;
	filteredOptions?: never;
	debounce?: never;
	multiple?: boolean;
}

// Pass a function that returns filtered options based on user input
interface AutocompleteFilteredOptions<T extends OptionLike>
	extends PromptOptions<T['value'] | T['value'][], AutocompletePrompt<T>> {
	filteredOptions: FilteredOptionsFunction<T>;
	debounce?: number;
	options?: never;
	filter?: never;
	multiple?: boolean;
}

type AutocompleteOptions<T extends OptionLike> =
	| AutocompleteUnfilteredOptions<T>
	| AutocompleteFilteredOptions<T>;

export default class AutocompletePrompt<T extends OptionLike> extends Prompt<
	T['value'] | T['value'][]
> {
	filteredOptions: T[];
	multiple: boolean;
	isNavigating = false;
	selectedValues: Array<T['value']> = [];
	focusedValue: T['value'] | undefined;

	// Async state (only used when filteredOptions returns a Promise)
	isLoading = false;
	searchError: Error | undefined;
	spinnerFrameIndex = 0;

	#cursor = 0;
	#lastUserInput = '';

	#filteredOptionsFn: FilteredOptionsFunction<T>;
	#isAsync = false;
	#debounceMs = 300;
	#debounceTimer: NodeJS.Timeout | null = null;
	#abortController: AbortController | null = null;
	#spinnerInterval: NodeJS.Timeout | null = null;

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

		this.multiple = opts.multiple === true;
		this.filteredOptions = [];

		if (opts.filteredOptions) {
			// User provided a function to get filtered options

			// Validate incompatible options
			if (opts.options) {
				throw new Error('AutocompletePrompt: "options" cannot be used with "filteredOptions"');
			}
			if (opts.filter) {
				throw new Error('AutocompletePrompt: "filter" cannot be used with "filteredOptions"');
			}

			this.#filteredOptionsFn = opts.filteredOptions;
			this.#debounceMs = opts.debounce ?? 300;
		} else {
			// Otherwise, user passed static options and optional filter function, and we'll handle filtering

			// Validate incompatible options
			if (opts.debounce) {
				throw new Error('AutocompletePrompt: "debounce" is only valid with "filteredOptions"');
			}

			const getOptions: () => T[] =
				typeof opts.options === 'function' ? opts.options.bind(this) : () => opts.options as T[];
			const filterFn = opts.filter ?? defaultFilter;

			this.#filteredOptionsFn = (query: string) => {
				const allOptions = getOptions();
				if (!query) {
					return [...allOptions];
				}
				return allOptions.filter((opt) => filterFn(query, opt));
			};

			// Set initial filteredOptions
			this.filteredOptions = [...getOptions()];

			// Handle initial values and focus (only for static options mode)
			if (this.filteredOptions.length > 0) {
				let initialValues: unknown[] | undefined;

				if (Array.isArray(opts.initialValue)) {
					initialValues = this.multiple ? opts.initialValue : opts.initialValue.slice(0, 1);
				} else if (!this.multiple) {
					// For single-select, default to first option
					initialValues = [this.filteredOptions[0].value];
				}

				if (initialValues) {
					for (const selectedValue of initialValues) {
						const selectedIndex = this.filteredOptions.findIndex(
							(opt) => opt.value === selectedValue
						);
						if (selectedIndex !== -1) {
							this.toggleSelected(selectedValue);
							this.#cursor = selectedIndex;
						}
					}
				}

				// Set focusedValue to enable tab/space selection
				this.focusedValue = this.filteredOptions[this.#cursor]?.value;
			}
		}

		this.on('key', (char, key) => this.#onKey(char, key));
		this.on('userInput', (value) => this.#onUserInputChanged(value));
	}

	override prompt() {
		// Trigger initial search for filteredOptions mode (static mode already has options set)
		if (this.filteredOptions.length === 0) {
			this.#abortController = new AbortController();
			const result = this.#filteredOptionsFn('', this.#abortController.signal);

			if (isThenable(result)) {
				// Async - defer handling to next tick
				this.#isAsync = true;
				setImmediate(() => {
					this.#handleAsyncResult(result);
				});
			} else {
				// Sync - apply immediately
				this.filteredOptions = result;
				this.#updateCursorAndFocus();
			}
		}

		return super.prompt();
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
		const isReturnKey = key.name === 'return';

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

	#onUserInputChanged(value: string): void {
		if (value === this.#lastUserInput) {
			return;
		}

		this.#lastUserInput = value;

		if (this.#isAsync) {
			this.#triggerDebouncedSearch(value);
		} else {
			this.#performSearch(value);
		}
	}

	#triggerDebouncedSearch(query: string): void {
		if (this.#debounceTimer) {
			clearTimeout(this.#debounceTimer);
		}

		// Show loading state immediately
		if (!this.isLoading) {
			this.#setLoadingState(true);
		}

		this.#debounceTimer = setTimeout(() => {
			this.#performSearch(query);
		}, this.#debounceMs);
	}

	#performSearch(query: string): void {
		// Create AbortController for this search (sync functions ignore signal, async can use for cancellation)
		if (this.#abortController) {
			this.#abortController.abort();
		}
		this.#abortController = new AbortController();
		const result = this.#filteredOptionsFn(query, this.#abortController.signal);

		if (isThenable(result)) {
			// Detected async - enable debouncing for subsequent searches
			this.#isAsync = true;
			this.#handleAsyncResult(result);
		} else {
			// Sync result - apply immediately
			this.filteredOptions = result as T[];
			this.#updateCursorAndFocus();
			this.render();
		}
	}

	async #handleAsyncResult(resultPromise: PromiseLike<T[]>): Promise<void> {
		// Store reference to detect if a newer request aborts this one
		const currentController = this.#abortController;
		this.#setLoadingState(false);

		try {
			const results = await resultPromise;
			// Check if this request was aborted (a new request came in)
			if (currentController?.signal.aborted) {
				return;
			}

			this.filteredOptions = results;
			this.#updateCursorAndFocus();
		} catch (error) {
			if (currentController?.signal.aborted) {
				return;
			}
			this.searchError = error instanceof Error ? error : new Error(String(error));
		}
	}

	#setLoadingState(isLoading: boolean): void {
		this.isLoading = isLoading;
		this.spinnerFrameIndex = 0;

		if (this.#spinnerInterval) {
			clearInterval(this.#spinnerInterval);
		}
		this.#spinnerInterval = isLoading
			? setInterval(() => {
					this.spinnerFrameIndex = (this.spinnerFrameIndex + 1) % 4;
					this.render();
				}, 80)
			: null;

		this.render();
	}

	#updateCursorAndFocus(): void {
		this.#cursor = getCursorForValue(this.focusedValue, this.filteredOptions);
		this.focusedValue = this.filteredOptions[this.#cursor]?.value;
		if (!this.multiple) {
			if (this.focusedValue !== undefined) {
				this.toggleSelected(this.focusedValue);
			} else {
				this.deselectAll();
			}
		}
	}
}
