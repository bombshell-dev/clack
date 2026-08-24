import { styleText } from 'node:util';
import type { Validate } from '@clack/core';
import { AutocompletePrompt, isAsync, settings } from '@clack/core';
import {
	type CommonOptions,
	N_INTERVAL,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE,
	S_SPINNER,
	symbol,
} from './common.js';
import { limitOptions } from './limit-options.js';
import type { Option } from './select.js';

function getLabel<T>(option: Option<T>) {
	return option.label ?? String(option.value ?? '');
}

function getFilteredOption<T>(searchText: string, option: Option<T>): boolean {
	if (!searchText) {
		return true;
	}
	const label = (option.label ?? String(option.value ?? '')).toLowerCase();
	const hint = (option.hint ?? '').toLowerCase();
	const value = String(option.value).toLowerCase();
	const term = searchText.toLowerCase();

	return label.includes(term) || hint.includes(term) || value.includes(term);
}

function getSelectedOptions<T>(values: T[], options: Option<T>[]): Option<T>[] {
	const results: Option<T>[] = [];

	for (const option of options) {
		if (values.includes(option.value)) {
			results.push(option);
		}
	}

	return results;
}

function getAsyncFilter<Value>(
	opts: AutocompleteOptions<Value>
): AutocompleteSharedOptionsAsync<Value>['filter'] {
	// filter not provided at all
	if (!('filter' in opts)) return;

	if (opts.filter) {
		return opts.filter;
	}

	// filter undefined
	return (search: string, opt: Option<Value>) => {
		return getFilteredOption(search, opt);
	};
}

/**
 * Options for the {@link autocomplete} prompt.
 */
type AutocompleteSharedOptions<Value> = CommonOptions & {
	/**
	 * The message or question shown to the user above the input.
	 */
	message: string;

	/**
	 * The maximum number of items/options to display in the autocomplete list at once.
	 */
	maxItems?: number;

	/**
	 * Placeholder text displayed when the search field is empty. When set, pressing
	 * tab copies the placeholder into the input.
	 */
	placeholder?: string;

	/**
	 * A function or a [Standard Schema](https://github.com/standard-schema/standard-schema)
	 * that validates user input. If a custom function is given, you should return a `string` or `Error`
	 * to show as a validation error, or `undefined` to accept the result.
	 */
	validate?: Validate<Value | Value[]>;
} & (AutocompleteSharedOptionsSync<Value> | AutocompleteSharedOptionsAsync<Value>);

interface AutocompleteSharedOptionsSync<Value> {
	/**
	 * The options to present, or a function that returns the options to present
	 * allowing for custom search/filtering.
	 *
	 * @see https://bomb.sh/docs/clack/packages/prompts/#dynamic-options-getter
	 */
	options: Option<Value>[] | ((this: AutocompletePrompt<Option<Value>>) => Option<Value>[]);
	/**
	 * Custom filter function to match options against the search input.
	 */
	filter?: (search: string, option: Option<Value>) => boolean;
}

interface AutocompleteSharedOptionsAsync<Value> {
	/**
	 * Available async options for the autocomplete prompt.
	 */
	options: (
		this: AutocompletePrompt<Option<Value>>,
		signal?: AbortSignal
	) => Promise<Option<Value>[]>;
	/**
	 * Frames to show during the loading of the options.
	 */
	frames?: string[];
	/**
	 * Interval between each frame.
	 */
	interval?: number;
	/**
	 * Debounce for user inputs before doing getting new options.
	 */
	debounce?: number;
	/**
	 * Custom filter function to match options against search input.
	 * - null (default): not filter function will be used.
	 * - undefined: a default filter that matches label, hint, and value is used.
	 */
	filter?: ((search: string, option: Option<Value>) => boolean);
}

export type AutocompleteOptions<Value> = AutocompleteSharedOptions<Value> & {
	/**
	 * The initially selected option from the list.
	 */
	initialValue?: Value;

	/**
	 * The starting value shown in the users input box.
	 */
	initialUserInput?: string;

	/**
	 * When `true`, pressing Tab fills the input with the currently focused
	 * option's value, as if the user had typed it.
	 */
	completeOnTab?: boolean;
}

/**
 * The `autocomplete` prompt combines a text input with a searchable list of options.
 * It's perfect for when you have a large list of options and want to help users
 * find what they're looking for quickly.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#autocomplete
 *
 * @example
 * ```ts
 * import { autocomplete } from '@clack/prompts';
 *
 * const framework = await autocomplete({
 *   message: 'Search for a framework',
 *   options: [
 *     { value: 'next', label: 'Next.js', hint: 'React framework' },
 *     { value: 'astro', label: 'Astro', hint: 'Content-focused' },
 *     { value: 'svelte', label: 'SvelteKit', hint: 'Compile-time framework' },
 *     { value: 'remix', label: 'Remix', hint: 'Full stack framework' },
 *     { value: 'nuxt', label: 'Nuxt', hint: 'Vue framework' },
 *   ],
 *   placeholder: 'Type to search...',
 *   maxItems: 5,
 * });
 * ```
 */
export const autocomplete = <Value>(opts: AutocompleteOptions<Value>) => {
	const frames = ('frames' in opts && opts.frames) || S_SPINNER;

	let prompt: AutocompletePrompt<Option<Value>>;

	const sharedConfig = {
		initialValue: opts.initialValue ? [opts.initialValue] : undefined,
		initialUserInput: opts.initialUserInput,
		placeholder: opts.placeholder,
		completeOnTab: opts.completeOnTab,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		validate: opts.validate,
		render(this: AutocompletePrompt<Option<Value>>) {
			const promptSymbol = this.isLoading
				? styleText('magenta', frames[this.spinnerIndex]!)
				: symbol(this.state);

			const hasGuide = opts.withGuide ?? settings.withGuide;
			const guide = hasGuide ? styleText('gray', S_BAR) : '';

			// Title and message display
			const headings = hasGuide
				? [guide, `${promptSymbol}  ${opts.message}`]
				: [`${promptSymbol}  ${opts.message}`];
			const userInput = this.userInput;
			const options = this.options;
			const placeholder = opts.placeholder;
			const showPlaceholder = userInput === '' && placeholder !== undefined;
			const opt = (option: Option<Value>, state: 'inactive' | 'active' | 'disabled') => {
				const label = getLabel(option);
				const hint =
					option.hint && option.value === this.focusedValue
						? styleText('dim', ` (${option.hint})`)
						: '';
				switch (state) {
					case 'active':
						return `${styleText('green', S_RADIO_ACTIVE)} ${label}${hint}`;
					case 'inactive':
						return `${styleText('dim', S_RADIO_INACTIVE)} ${styleText('dim', label)}`;
					case 'disabled':
						return `${styleText('gray', S_RADIO_INACTIVE)} ${styleText(['strikethrough', 'gray'], label)}`;
				}
			};

			// Handle different states
			switch (this.state) {
				case 'submit': {
					// Show selected value
					const selected = getSelectedOptions(this.selectedValues, options);
					const label =
						selected.length > 0 ? `  ${styleText('dim', selected.map(getLabel).join(', '))}` : '';
					return `${headings.join('\n')}\n${guide}${label}`;
				}

				case 'cancel': {
					const userInputText = userInput
						? `  ${styleText(['strikethrough', 'dim'], userInput)}`
						: '';
					return `${headings.join('\n')}\n${guide}${userInputText}`;
				}

				default: {
					const barStyle = this.state === 'error' ? 'yellow' : 'cyan';
					const guidePrefix = hasGuide ? `${styleText(barStyle, S_BAR)}  ` : '';
					const guidePrefixEnd = hasGuide ? styleText(barStyle, S_BAR_END) : '';
					// Display cursor position - show plain text in navigation mode
					let searchText = '';
					if (this.isNavigating || showPlaceholder) {
						const searchTextValue = showPlaceholder ? placeholder : userInput;
						searchText = searchTextValue !== '' ? ` ${styleText('dim', searchTextValue)}` : '';
					} else {
						searchText = ` ${this.userInputWithCursor}`;
					}

					// Show match count if filtered
					const matches =
						this.filteredOptions.length !== options.length
							? styleText(
									'dim',
									` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? '' : 'es'})`
								)
							: '';

					// No matches message
					const noResults =
						this.filteredOptions.length === 0 && userInput && !this.isLoading
							? [`${guidePrefix}${styleText('yellow', 'No matches found')}`]
							: [];

					const validationError =
						this.state === 'error' ? [`${guidePrefix}${styleText('yellow', this.error)}`] : [];

					if (hasGuide) {
						headings.push(`${guidePrefix.trimEnd()}`);
					}
					headings.push(
						`${guidePrefix}${styleText('dim', 'Search:')}${searchText}${matches}`,
						...noResults,
						...validationError
					);

					// Show instructions
					const instructions = [
						`${styleText('dim', '↑/↓')} to select`,
						...(opts.completeOnTab ? [`${styleText('dim', 'Tab:')} complete`] : []),
						`${styleText('dim', 'Enter:')} confirm`,
						`${styleText('dim', 'Type:')} to search`,
					];

					const footers = [`${guidePrefix}${instructions.join(' • ')}`, guidePrefixEnd];

					// Render options with selection
					const displayOptions =
						this.filteredOptions.length === 0
							? []
							: limitOptions({
									cursor: this.cursor,
									options: this.filteredOptions,
									columnPadding: hasGuide ? 3 : 0, // for `|  ` when guide is shown
									rowPadding: headings.length + footers.length,
									style: (option, active) => {
										return opt(
											option,
											option.disabled ? 'disabled' : active ? 'active' : 'inactive'
										);
									},
									maxItems: opts.maxItems,
									output: opts.output,
								});

					// Return the formatted prompt
					return [
						...headings,
						...displayOptions.map((option) => `${guidePrefix}${option}`),
						...footers,
					].join('\n');
				}
			}
		},
	};

	// Create autocomplete prompt based on if the option is async or not
	if (
		isAsync<AutocompleteSharedOptionsSync<Value>, AutocompleteSharedOptionsAsync<Value>>(
			opts,
			'options'
		)
	) {
		prompt = new AutocompletePrompt<Option<Value>>({
			...sharedConfig,
			options: opts.options,
			frameCount: frames.length,
			interval: opts.interval ?? N_INTERVAL,
			debounce: opts.debounce,
			filter: getAsyncFilter(opts),
		});
	} else {
		prompt = new AutocompletePrompt<Option<Value>>({
			...sharedConfig,
			options: opts.options,
			filter:
				opts.filter ??
				((search: string, opt: Option<Value>) => {
					return getFilteredOption(search, opt);
				}),
		});
	}

	// Return the result or cancel symbol
	return prompt.prompt() as Promise<Value | symbol>;
};

/**
 * Options for the {@link autocompleteMultiselect} prompt
 */
export type AutocompleteMultiSelectOptions<Value> = AutocompleteSharedOptions<Value> & {
	/**
	 * The initially selected option(s) from the list.
	 */
	initialValues?: Value[];

	/**
	 * When `true` at least one option must be selected.
	 * @default false
	 */
	required?: boolean;
};

/**
 * The `autocompleteMultiselect` prompt combines the search functionality of autocomplete
 * with the ability to select multiple options.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#autocomplete-multiselect
 *
 * @example
 * ```ts
 * import { autocompleteMultiselect } from '@clack/prompts';
 *
 * const frameworks = await autocompleteMultiselect({
 *   message: 'Select frameworks',
 *   options: [
 *     { value: 'next', label: 'Next.js', hint: 'React framework' },
 *     { value: 'astro', label: 'Astro', hint: 'Content-focused' },
 *     { value: 'svelte', label: 'SvelteKit', hint: 'Compile-time framework' },
 *     { value: 'remix', label: 'Remix', hint: 'Full stack framework' },
 *     { value: 'nuxt', label: 'Nuxt', hint: 'Vue framework' },
 *   ],
 *   placeholder: 'Type to search...',
 *   maxItems: 5,
 * });
 * ```
 */
export const autocompleteMultiselect = <Value>(opts: AutocompleteMultiSelectOptions<Value>) => {
	const frames = ('frames' in opts && opts.frames) || S_SPINNER;

	let prompt: AutocompletePrompt<Option<Value>>;

	const formatOption = (
		option: Option<Value>,
		active: boolean,
		selectedValues: Value[],
		focusedValue: Value | undefined
	) => {
		const isSelected = selectedValues.includes(option.value);
		const label = option.label ?? String(option.value ?? '');
		const hint =
			option.hint && focusedValue !== undefined && option.value === focusedValue
				? styleText('dim', ` (${option.hint})`)
				: '';
		const checkbox = isSelected
			? styleText('green', S_CHECKBOX_SELECTED)
			: styleText('dim', S_CHECKBOX_INACTIVE);

		if (option.disabled) {
			return `${styleText('gray', S_CHECKBOX_INACTIVE)} ${styleText(['strikethrough', 'gray'], label)}`;
		}
		if (active) {
			return `${checkbox} ${label}${hint}`;
		}
		return `${checkbox} ${styleText('dim', label)}`;
	};

	// Create text prompt which we'll use as foundation
	const sharedConfig = {
		multiple: true,
		placeholder: opts.placeholder,
		validate: () => {
			if (opts.required && prompt.selectedValues.length === 0) {
				return 'Please select at least one item';
			}
			return undefined;
		},
		initialValue: opts.initialValues,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render(this: AutocompletePrompt<Option<Value>>) {
			const promptSymbol = this.isLoading
				? styleText('magenta', frames[this.spinnerIndex]!)
				: symbol(this.state);

			const hasGuide = opts.withGuide ?? settings.withGuide;

			// Title and symbol
			const titleGuide = hasGuide ? `${styleText('gray', S_BAR)}\n` : '';
			const title = `${titleGuide}${promptSymbol}  ${opts.message}\n`;

			// Selection counter
			const userInput = this.userInput;
			const placeholder = opts.placeholder;
			const showPlaceholder = userInput === '' && placeholder !== undefined;

			// Search input display
			const searchText =
				this.isNavigating || showPlaceholder
					? styleText('dim', showPlaceholder ? placeholder : userInput) // Just show plain text when in navigation mode
					: this.userInputWithCursor;

			const options = this.options;

			const matches =
				this.filteredOptions.length !== options.length
					? styleText(
							'dim',
							` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? '' : 'es'})`
						)
					: '';


			const inactiveGuidePrefix = hasGuide ? `${styleText('gray', S_BAR)}  ` : '';
			// Render prompt state
			switch (this.state) {
				case 'submit': {
					return `${title}${inactiveGuidePrefix}${styleText(
						'dim',
						`${this.selectedValues.length} items selected`
					)}`;
				}
				case 'cancel': {
					return `${title}${inactiveGuidePrefix}${styleText(
						['strikethrough', 'dim'],
						userInput
					)}`;
				}
				default: {
					const barStyle = this.state === 'error' ? 'yellow' : 'cyan';
					const guidePrefix = hasGuide ? `${styleText(barStyle, S_BAR)}  ` : '';
					const guidePrefixEnd = hasGuide ? styleText(barStyle, S_BAR_END) : '';
					// Instructions
					const instructions = [
						`${styleText('dim', '↑/↓')} to navigate`,
						`${styleText('dim', this.isNavigating ? 'Space/Tab:' : 'Tab:')} select`,
						`${styleText('dim', 'Enter:')} confirm`,
						`${styleText('dim', 'Type:')} to search`,
					];

					// No results message
					const noResults =
						this.filteredOptions.length === 0 && userInput && !this.isLoading
							? [`${guidePrefix}${styleText('yellow', 'No matches found')}`]
							: [];

					const errorMessage =
						this.state === 'error' ? [`${guidePrefix}${styleText('yellow', this.error)}`] : [];

					// Calculate header and footer line counts for rowPadding
					const headerLines = [
						...`${title}${hasGuide ? styleText(barStyle, S_BAR) : ''}`.split('\n'),
						`${guidePrefix}${styleText('dim', 'Search:')} ${searchText}${matches}`,
						...noResults,
						...errorMessage,
					];
					const footerLines = [`${guidePrefix}${instructions.join(' • ')}`, guidePrefixEnd];

					// Get limited options for display
					const displayOptions = limitOptions({
						cursor: this.cursor,
						options: this.filteredOptions,
						style: (option, active) =>
							formatOption(option, active, this.selectedValues, this.focusedValue),
						maxItems: opts.maxItems,
						output: opts.output,
						rowPadding: headerLines.length + footerLines.length,
					});

					// Build the prompt display
					return [
						...headerLines,
						...displayOptions.map((option) => `${guidePrefix}${option}`),
						...footerLines,
					].join('\n');
				}
			}
		},
	};

	// Create autocomplete prompt based on if the option is async or not
	if (
		isAsync<AutocompleteSharedOptionsSync<Value>, AutocompleteSharedOptionsAsync<Value>>(
			opts,
			'options'
		)
	) {
		prompt = new AutocompletePrompt<Option<Value>>({
			...sharedConfig,
			options: opts.options,
			frameCount: frames.length,
			interval: opts.interval ?? N_INTERVAL,
			debounce: opts.debounce,
			filter: getAsyncFilter(opts),
		});
	} else {
		prompt = new AutocompletePrompt<Option<Value>>({
			...sharedConfig,
			options: opts.options,
			filter:
				opts.filter ??
				((search, opt) => {
					return getFilteredOption(search, opt);
				}),
		});
	}

	// Return the result or cancel symbol
	return prompt.prompt() as Promise<Value[] | symbol>;
};
