import { AutocompletePrompt, isAsync, settings } from '@clack/core';
import color from 'picocolors';
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
	if (!('filter' in opts)) {
		return null;
	}

	if (opts.filter) {
		return opts.filter;
	}

	// filter undefined
	return (search: string, opt: Option<Value>) => {
		return getFilteredOption(search, opt);
	};
}

type AutocompleteSharedOptions<Value> = CommonOptions & {
	/**
	 * The message to display to the user.
	 */
	message: string;
	/**
	 * Maximum number of items to display at once.
	 */
	maxItems?: number;
	/**
	 * Placeholder text to display when no input is provided.
	 */
	placeholder?: string;
	/**
	 * Validates the value
	 */
	validate?: (value: Value | Value[] | undefined) => string | Error | undefined;
} & (AutocompleteSharedOptionsSync<Value> | AutocompleteSharedOptionsAsync<Value>);

interface AutocompleteSharedOptionsSync<Value> {
	/**
	 * Available options for the autocomplete prompt.
	 */
	options: Option<Value>[] | ((this: AutocompletePrompt<Option<Value>>) => Option<Value>[]);
	/**
	 * Custom filter function to match options against search input.
	 * If not provided, a default filter that matches label, hint, and value is used.
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
	filter?: ((search: string, option: Option<Value>) => boolean) | null;
}

export type AutocompleteOptions<Value> = AutocompleteSharedOptions<Value> & {
	/**
	 * The initial selected value.
	 */
	initialValue?: Value;
	/**
	 * The initial user input
	 */
	initialUserInput?: string;
};

export const autocomplete = <Value>(opts: AutocompleteOptions<Value>) => {
	const frames = ('frames' in opts && opts.frames) || S_SPINNER;

	let prompt: AutocompletePrompt<Option<Value>>;

	const sharedConfig = {
		initialValue: opts.initialValue ? [opts.initialValue] : undefined,
		initialUserInput: opts.initialUserInput,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		validate: opts.validate,
		render(this: AutocompletePrompt<Option<Value>>) {
			const promptSymbol = this.isLoading
				? color.magenta(frames[this.spinnerIndex])
				: symbol(this.state);

			const hasGuide = opts.withGuide ?? settings.withGuide;
			// Title and message display
			const headings = hasGuide
				? [`${color.gray(S_BAR)}`, `${promptSymbol}  ${opts.message}`]
				: [`${promptSymbol}  ${opts.message}`];
			const userInput = this.userInput;
			const options = this.options;
			const placeholder = opts.placeholder;
			const showPlaceholder = userInput === '' && placeholder !== undefined;
			const opt = (option: Option<Value>, state: 'inactive' | 'active' | 'disabled') => {
				const label = getLabel(option);
				const hint =
					option.hint && option.value === this.focusedValue ? color.dim(` (${option.hint})`) : '';
				switch (state) {
					case 'active':
						return `${color.green(S_RADIO_ACTIVE)} ${label}${hint}`;
					case 'inactive':
						return `${color.dim(S_RADIO_INACTIVE)} ${color.dim(label)}`;
					case 'disabled':
						return `${color.gray(S_RADIO_INACTIVE)} ${color.strikethrough(color.gray(label))}`;
				}
			};

			// Handle different states
			switch (this.state) {
				case 'submit': {
					// Show selected value
					const selected = getSelectedOptions(this.selectedValues, options);
					const label =
						selected.length > 0 ? `  ${color.dim(selected.map(getLabel).join(', '))}` : '';
					const submitPrefix = hasGuide ? color.gray(S_BAR) : '';
					return `${headings.join('\n')}\n${submitPrefix}${label}`;
				}

				case 'cancel': {
					const userInputText = userInput ? `  ${color.strikethrough(color.dim(userInput))}` : '';
					const cancelPrefix = hasGuide ? color.gray(S_BAR) : '';
					return `${headings.join('\n')}\n${cancelPrefix}${userInputText}`;
				}

				default: {
					const barColor = this.state === 'error' ? color.yellow : color.cyan;
					const guidePrefix = hasGuide ? `${barColor(S_BAR)}  ` : '';
					const guidePrefixEnd = hasGuide ? barColor(S_BAR_END) : '';
					// Display cursor position - show plain text in navigation mode
					let searchText = '';
					if (this.isNavigating || showPlaceholder) {
						const searchTextValue = showPlaceholder ? placeholder : userInput;
						searchText = searchTextValue !== '' ? ` ${color.dim(searchTextValue)}` : '';
					} else {
						searchText = ` ${this.userInputWithCursor}`;
					}

					// Show match count if filtered
					const matches =
						this.filteredOptions.length !== options.length
							? color.dim(
									` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? '' : 'es'})`
								)
							: '';

					// No matches message
					const noResults =
						this.filteredOptions.length === 0 && userInput && !this.isLoading
							? [`${guidePrefix}${color.yellow('No matches found')}`]
							: [];

					const validationError =
						this.state === 'error' ? [`${guidePrefix}${color.yellow(this.error)}`] : [];

					if (hasGuide) {
						headings.push(`${guidePrefix.trimEnd()}`);
					}
					headings.push(
						`${guidePrefix}${color.dim('Search:')}${searchText}${matches}`,
						...noResults,
						...validationError
					);

					// Show instructions
					const instructions = [
						`${color.dim('↑/↓')} to select`,
						`${color.dim('Enter:')} confirm`,
						`${color.dim('Type:')} to search`,
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

// Type definition for the autocompleteMultiselect component
export type AutocompleteMultiSelectOptions<Value> = AutocompleteSharedOptions<Value> & {
	/**
	 * The initial selected values
	 */
	initialValues?: Value[];
	/**
	 * If true, at least one option must be selected
	 */
	required?: boolean;
};

/**
 * Integrated autocomplete multiselect - combines type-ahead filtering with multiselect in one UI
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
				? color.dim(` (${option.hint})`)
				: '';
		const checkbox = isSelected ? color.green(S_CHECKBOX_SELECTED) : color.dim(S_CHECKBOX_INACTIVE);

		if (option.disabled) {
			return `${color.gray(S_CHECKBOX_INACTIVE)} ${color.strikethrough(color.gray(label))}`;
		}
		if (active) {
			return `${checkbox} ${label}${hint}`;
		}
		return `${checkbox} ${color.dim(label)}`;
	};

	// Create text prompt which we'll use as foundation
	const sharedConfig = {
		multiple: true,
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
			// Symbol and title
			const promptSymbol = this.isLoading
				? color.magenta(frames[this.spinnerIndex])
				: symbol(this.state);

			const title = `${color.gray(S_BAR)}\n${promptSymbol}  ${opts.message}\n`;

			// Selection counter
			const userInput = this.userInput;
			const placeholder = opts.placeholder;
			const showPlaceholder = userInput === '' && placeholder !== undefined;

			// Search input display
			const searchText =
				this.isNavigating || showPlaceholder
					? color.dim(showPlaceholder ? placeholder : userInput) // Just show plain text when in navigation mode
					: this.userInputWithCursor;

			const options = this.options;

			const matches =
				this.filteredOptions.length !== options.length
					? color.dim(
							` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? '' : 'es'})`
						)
					: '';

			// Render prompt state
			switch (this.state) {
				case 'submit': {
					return `${title}${color.gray(S_BAR)}  ${color.dim(`${this.selectedValues.length} items selected`)}`;
				}
				case 'cancel': {
					return `${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(userInput))}`;
				}
				default: {
					const barColor = this.state === 'error' ? color.yellow : color.cyan;
					// Instructions
					const instructions = [
						`${color.dim('↑/↓')} to navigate`,
						`${color.dim(this.isNavigating ? 'Space/Tab:' : 'Tab:')} select`,
						`${color.dim('Enter:')} confirm`,
						`${color.dim('Type:')} to search`,
					];

					// No results message
					const noResults =
						this.filteredOptions.length === 0 && userInput && !this.isLoading
							? [`${barColor(S_BAR)}  ${color.yellow('No matches found')}`]
							: [];

					const errorMessage =
						this.state === 'error' ? [`${barColor(S_BAR)}  ${color.yellow(this.error)}`] : [];

					// Calculate header and footer line counts for rowPadding
					const headerLines = [
						...`${title}${barColor(S_BAR)}`.split('\n'),
						`${barColor(S_BAR)}  ${color.dim('Search:')} ${searchText}${matches}`,
						...noResults,
						...errorMessage,
					];
					const footerLines = [
						`${barColor(S_BAR)}  ${instructions.join(' • ')}`,
						`${barColor(S_BAR_END)}`,
					];

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
						...displayOptions.map((option) => `${barColor(S_BAR)}  ${option}`),
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
