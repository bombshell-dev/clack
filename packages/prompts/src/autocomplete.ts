import { AutocompletePrompt } from '@clack/core';
import color from 'picocolors';
import {
	type CommonOptions,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE,
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

interface AutocompleteSharedOptions<Value> extends CommonOptions {
	/**
	 * The message to display to the user.
	 */
	message: string;
	/**
	 * Available options for the autocomplete prompt.
	 */
	options: Option<Value>[] | ((this: AutocompletePrompt<Option<Value>>) => Option<Value>[]);
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
}

export interface AutocompleteOptions<Value> extends AutocompleteSharedOptions<Value> {
	/**
	 * The initial selected value.
	 */
	initialValue?: Value;
	/**
	 * The initial user input
	 */
	initialUserInput?: string;
}

export const autocomplete = <Value>(opts: AutocompleteOptions<Value>) => {
	const prompt = new AutocompletePrompt({
		options: opts.options,
		initialValue: opts.initialValue ? [opts.initialValue] : undefined,
		initialUserInput: opts.initialUserInput,
		filter: (search: string, opt: Option<Value>) => {
			return getFilteredOption(search, opt);
		},
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		validate: opts.validate,
		render() {
			// Title and message display
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const userInput = this.userInput;
			const valueAsString = String(this.value ?? '');
			const options = this.options;
			const placeholder = opts.placeholder;
			const showPlaceholder = valueAsString === '' && placeholder !== undefined;

			// Handle different states
			switch (this.state) {
				case 'submit': {
					// Show selected value
					const selected = getSelectedOptions(this.selectedValues, options);
					const label =
						selected.length > 0 ? `  ${color.dim(selected.map(getLabel).join(', '))}` : '';
					return `${title}${color.gray(S_BAR)}${label}`;
				}

				case 'cancel': {
					const userInputText = userInput ? `  ${color.strikethrough(color.dim(userInput))}` : '';
					return `${title}${color.gray(S_BAR)}${userInputText}`;
				}

				default: {
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

					// Render options with selection
					const displayOptions =
						this.filteredOptions.length === 0
							? []
							: limitOptions({
									cursor: this.cursor,
									options: this.filteredOptions,
									style: (option, active) => {
										const label = getLabel(option);
										const hint =
											option.hint && option.value === this.focusedValue
												? color.dim(` (${option.hint})`)
												: '';

										return active
											? `${color.green(S_RADIO_ACTIVE)} ${label}${hint}`
											: `${color.dim(S_RADIO_INACTIVE)} ${color.dim(label)}${hint}`;
									},
									maxItems: opts.maxItems,
									output: opts.output,
								});

					// Show instructions
					const instructions = [
						`${color.dim('↑/↓')} to select`,
						`${color.dim('Enter:')} confirm`,
						`${color.dim('Type:')} to search`,
					];

					// No matches message
					const noResults =
						this.filteredOptions.length === 0 && userInput
							? [`${color.cyan(S_BAR)}  ${color.yellow('No matches found')}`]
							: [];

					const validationError =
						this.state === 'error' ? [`${color.yellow(S_BAR)}  ${color.yellow(this.error)}`] : [];

					// Return the formatted prompt
					return [
						`${title}${color.cyan(S_BAR)}`,
						`${color.cyan(S_BAR)}  ${color.dim('Search:')}${searchText}${matches}`,
						...noResults,
						...validationError,
						...displayOptions.map((option) => `${color.cyan(S_BAR)}  ${option}`),
						`${color.cyan(S_BAR)}  ${color.dim(instructions.join(' • '))}`,
						`${color.cyan(S_BAR_END)}`,
					].join('\n');
				}
			}
		},
	});

	// Return the result or cancel symbol
	return prompt.prompt() as Promise<Value | symbol>;
};

// Type definition for the autocompleteMultiselect component
export interface AutocompleteMultiSelectOptions<Value> extends AutocompleteSharedOptions<Value> {
	/**
	 * The initial selected values
	 */
	initialValues?: Value[];
	/**
	 * If true, at least one option must be selected
	 */
	required?: boolean;
}

/**
 * Integrated autocomplete multiselect - combines type-ahead filtering with multiselect in one UI
 */
export const autocompleteMultiselect = <Value>(opts: AutocompleteMultiSelectOptions<Value>) => {
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

		if (active) {
			return `${checkbox} ${label}${hint}`;
		}
		return `${checkbox} ${color.dim(label)}`;
	};

	// Create text prompt which we'll use as foundation
	const prompt = new AutocompletePrompt<Option<Value>>({
		options: opts.options,
		multiple: true,
		filter: (search, opt) => {
			return getFilteredOption(search, opt);
		},
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
		render() {
			// Title and symbol
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

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
					// Instructions
					const instructions = [
						`${color.dim('↑/↓')} to navigate`,
						`${color.dim('Space:')} select`,
						`${color.dim('Enter:')} confirm`,
						`${color.dim('Type:')} to search`,
					];

					// No results message
					const noResults =
						this.filteredOptions.length === 0 && userInput
							? [`${color.cyan(S_BAR)}  ${color.yellow('No matches found')}`]
							: [];

					const errorMessage =
						this.state === 'error' ? [`${color.cyan(S_BAR)}  ${color.yellow(this.error)}`] : [];

					// Get limited options for display
					const displayOptions = limitOptions({
						cursor: this.cursor,
						options: this.filteredOptions,
						style: (option, active) =>
							formatOption(option, active, this.selectedValues, this.focusedValue),
						maxItems: opts.maxItems,
						output: opts.output,
					});

					// Build the prompt display
					return [
						title,
						`${color.cyan(S_BAR)}  ${color.dim('Search:')} ${searchText}${matches}`,
						...noResults,
						...errorMessage,
						...displayOptions.map((option) => `${color.cyan(S_BAR)}  ${option}`),
						`${color.cyan(S_BAR)}  ${color.dim(instructions.join(' • '))}`,
						`${color.cyan(S_BAR_END)}`,
					].join('\n');
				}
			}
		},
	});

	// Return the result or cancel symbol
	return prompt.prompt() as Promise<Value | symbol>;
};
