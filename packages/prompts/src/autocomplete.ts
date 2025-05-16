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

export interface AutocompleteOptions<Value> extends CommonOptions {
	/**
	 * The message to display to the user.
	 */
	message: string;
	/**
	 * Available options for the autocomplete prompt.
	 */
	options: Option<Value>[] | ((this: AutocompletePrompt<Option<Value>>) => Option<Value>[]);
	/**
	 * The initial selected value.
	 */
	initialValue?: Value;
	/**
	 * Maximum number of items to display at once.
	 */
	maxItems?: number;
	/**
	 * Placeholder text to display when no input is provided.
	 */
	placeholder?: string;
}

export const autocomplete = <Value>(opts: AutocompleteOptions<Value>) => {
	const prompt = new AutocompletePrompt({
		options: opts.options,
		placeholder: opts.placeholder,
		initialValue: opts.initialValue,
		filter: (search: string, opt: Option<Value>) => {
			return getFilteredOption(search, opt);
		},
		input: opts.input,
		output: opts.output,
		render() {
			// Title and message display
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const valueAsString = String(this.value ?? '');
			const options = this.options;

			// Handle different states
			switch (this.state) {
				case 'submit': {
					// Show selected value
					const selected = getSelectedOptions(this.selectedValues, options);
					const label = selected.length > 0 ? selected.map(getLabel).join(', ') : '';
					return `${title}${color.gray(S_BAR)}  ${color.dim(label)}`;
				}

				case 'cancel': {
					return `${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(this.value ?? ''))}`;
				}

				default: {
					// Display cursor position - show plain text in navigation mode
					const searchText = this.isNavigating ? color.dim(valueAsString) : this.valueWithCursor;

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
						this.filteredOptions.length === 0 && valueAsString
							? [`${color.cyan(S_BAR)}  ${color.yellow('No matches found')}`]
							: [];

					// Return the formatted prompt
					return [
						title,
						`${color.cyan(S_BAR)}  ${color.dim('Search:')} ${searchText}${matches}`,
						...noResults,
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
export interface AutocompleteMultiSelectOptions<Value> {
	/**
	 * The message to display to the user
	 */
	message: string;
	/**
	 * The options for the user to choose from
	 */
	options: Option<Value>[] | (() => Option<Value>[]);
	/**
	 * The initial selected values
	 */
	initialValues?: Value[];
	/**
	 * The maximum number of items that can be selected
	 */
	maxItems?: number;
	/**
	 * The placeholder to display in the input
	 */
	placeholder?: string;
	/**
	 * The stream to read from
	 */
	input?: NodeJS.ReadStream;
	/**
	 * The stream to write to
	 */
	output?: NodeJS.WriteStream;
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
		placeholder: opts.placeholder,
		initialValue: opts.initialValues,
		input: opts.input,
		output: opts.output,
		render() {
			// Title and symbol
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			// Selection counter
			const value = String(this.value ?? '');

			// Search input display
			const searchText = this.isNavigating
				? color.dim(value) // Just show plain text when in navigation mode
				: this.valueWithCursor;

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
					return `${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(value))}`;
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
						this.filteredOptions.length === 0 && value
							? [`${color.cyan(S_BAR)}  ${color.yellow('No matches found')}`]
							: [];

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
