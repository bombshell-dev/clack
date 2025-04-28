import { TextPrompt } from '@clack/core';
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

export interface AutocompleteOptions<Value> extends CommonOptions {
	/**
	 * The message to display to the user.
	 */
	message: string;
	/**
	 * Available options for the autocomplete prompt.
	 */
	options: Option<Value>[];
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
	// Track input, cursor position, and filtering - similar to multiselect
	let input = '';
	let cursor = 0;
	let filtered = [...opts.options];
	let selectedValue = opts.initialValue;
	let isEventsRegistered = false;
	let isNavigating = false;

	// Filter options based on search input
	const filterOptions = (searchText: string) => {
		const prevLength = filtered.length;
		const prevSelected = filtered[cursor]?.value;

		if (searchText) {
			filtered = opts.options.filter((option) => {
				const label = (option.label ?? String(option.value ?? '')).toLowerCase();
				const hint = (option.hint ?? '').toLowerCase();
				const value = String(option.value).toLowerCase();
				const term = searchText.toLowerCase();

				return label.includes(term) || hint.includes(term) || value.includes(term);
			});
		} else {
			filtered = [...opts.options];
		}

		// If filtering changed the available options, update cursor
		if (prevLength !== filtered.length || !filtered.length) {
			if (filtered.length === 0) {
				cursor = 0;
			} else if (prevSelected !== undefined) {
				// Try to maintain the same selected item
				const index = filtered.findIndex((o) => o.value === prevSelected);
				cursor = index !== -1 ? index : 0;
			} else {
				cursor = 0;
			}
		}

		// Ensure cursor is within bounds
		if (cursor >= filtered.length && filtered.length > 0) {
			cursor = filtered.length - 1;
		}

		// Update selected value based on cursor
		if (filtered.length > 0) {
			selectedValue = filtered[cursor].value;
		}
	};

	// Create text prompt
	const prompt = new TextPrompt({
		placeholder: opts.placeholder,
		initialValue: '',
		input: opts.input,
		output: opts.output,
		render() {
			// Register event handlers only once
			if (!isEventsRegistered) {
				// Handle keyboard navigation
				this.on('key', (key) => {
					// Start navigation mode with up/down arrows
					if (key === 'up' || key === 'down') {
						isNavigating = true;
					}

					// Allow typing again when user presses any other key
					if (key !== 'up' && key !== 'down' && key !== 'return') {
						isNavigating = false;
					}
				});

				// Handle cursor movement
				this.on('cursor', (key) => {
					if (filtered.length === 0) return;

					// Enter navigation mode
					isNavigating = true;

					if (key === 'up') {
						cursor = cursor > 0 ? cursor - 1 : filtered.length - 1;
					} else if (key === 'down') {
						cursor = cursor < filtered.length - 1 ? cursor + 1 : 0;
					}

					// Update selected value
					if (filtered.length > 0) {
						selectedValue = filtered[cursor].value;
					}
				});

				// Register input change handler to update filtering
				this.on('value', () => {
					// Only update input when not in navigation mode
					if (!isNavigating) {
						const newInput = this.value || '';
						if (newInput !== input) {
							input = newInput;
							filterOptions(input);
						}
					}
				});

				isEventsRegistered = true;
			}

			// Handle initial state
			if (this.state === 'initial') {
				input = this.value || '';
				filterOptions(input);

				// Set initial selection if provided
				if (opts.initialValue !== undefined && !selectedValue) {
					const initialIndex = opts.options.findIndex((o) => o.value === opts.initialValue);
					if (initialIndex !== -1) {
						cursor = initialIndex;
						selectedValue = opts.options[initialIndex].value;
					}
				}
			}

			// Set selection on submit
			if (this.state === 'submit') {
				this.value = selectedValue as any;
			}

			// Title and message display
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			// Handle different states
			switch (this.state) {
				case 'submit': {
					// Show selected value
					const selected = opts.options.find((o) => o.value === selectedValue);
					const label = selected ? getLabel(selected) : '';
					return `${title}${color.gray(S_BAR)}  ${color.dim(label)}`;
				}

				case 'cancel': {
					return `${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(this.value || ''))}`;
				}

				default: {
					// Mode indicator (for debugging)
					const modeIndicator = isNavigating ? color.yellow(' [navigation]') : '';

					// Display cursor position - show plain text in navigation mode
					const searchText = isNavigating
						? color.dim(input)
						: this.value
							? this.valueWithCursor
							: color.inverse(color.hidden('_'));

					// Show match count if filtered
					const matches =
						filtered.length !== opts.options.length
							? color.dim(` (${filtered.length} match${filtered.length === 1 ? '' : 'es'})`)
							: '';

					// Render options with selection
					const displayOptions =
						filtered.length === 0
							? []
							: limitOptions({
									cursor: cursor,
									options: filtered,
									style: (option, active) => {
										const label = getLabel(option);
										const hint = option.hint ? color.dim(` (${option.hint})`) : '';

										return active
											? `${color.green(S_RADIO_ACTIVE)} ${label}${hint}`
											: `${color.dim(S_RADIO_INACTIVE)} ${color.dim(label)}${hint}`;
									},
									maxItems: opts.maxItems,
									output: opts.output,
								});

					// Show instructions
					const instructions = isNavigating
						? [
								`${color.dim('↑/↓')} to select, ${color.dim('Enter:')} confirm, ${color.dim('Type:')} to search`,
							]
						: [`${color.dim('Type')} to filter, ${color.dim('↑/↓')} to navigate`];

					// No matches message
					const noResults =
						filtered.length === 0 && input
							? [`${color.cyan(S_BAR)}  ${color.yellow('No matches found')}`]
							: [];

					// Return the formatted prompt
					return [
						title,
						`${color.cyan(S_BAR)}  ${color.dim('Search:')} ${searchText}${matches}${modeIndicator}`,
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
	options: Option<Value>[];
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
	// Track input, filtering, selection, and cursor state
	let input = '';
	let cursor = 0;
	let filtered = [...opts.options];
	let selectedValues: Value[] = [...(opts.initialValues ?? [])];
	let isEventsRegistered = false;
	let isNavigating = false; // Track if we're in navigation mode

	// Format a single option
	const formatOption = (option: Option<Value>, active: boolean) => {
		const isSelected = selectedValues.includes(option.value);
		const label = option.label ?? String(option.value ?? '');
		const hint = option.hint ? color.dim(` (${option.hint})`) : '';
		const checkbox = isSelected ? color.green(S_CHECKBOX_SELECTED) : color.dim(S_CHECKBOX_INACTIVE);

		if (active) {
			return `${color.green('›')} ${checkbox} ${label}${hint}`;
		}
		return `${color.dim(' ')} ${checkbox} ${color.dim(label)}${hint}`;
	};

	// Filter options based on search input
	const filterOptions = (searchText: string) => {
		const prevLength = filtered.length;
		const prevSelected = filtered[cursor]?.value;

		if (searchText) {
			filtered = opts.options.filter((option) => {
				const label = (option.label ?? String(option.value ?? '')).toLowerCase();
				const hint = (option.hint ?? '').toLowerCase();
				const value = String(option.value).toLowerCase();
				const term = searchText.toLowerCase();

				return label.includes(term) || hint.includes(term) || value.includes(term);
			});
		} else {
			filtered = [...opts.options];
		}

		// If filtering changed the available options, update cursor
		if (prevLength !== filtered.length || !filtered.length) {
			if (filtered.length === 0) {
				cursor = 0;
			} else if (prevSelected !== undefined) {
				// Try to maintain the same selected item
				const index = filtered.findIndex((o) => o.value === prevSelected);
				cursor = index !== -1 ? index : 0;
			} else {
				cursor = 0;
			}
		}

		// Ensure cursor is within bounds in any case
		if (cursor >= filtered.length && filtered.length > 0) {
			cursor = filtered.length - 1;
		}
	};

	// Toggle selection of current item
	const toggleSelected = () => {
		if (filtered.length === 0) return;

		const value = filtered[cursor].value;
		if (selectedValues.includes(value)) {
			selectedValues = selectedValues.filter((v) => v !== value);
		} else {
			selectedValues = [...selectedValues, value];
		}
	};

	// Create text prompt which we'll use as foundation
	const prompt = new TextPrompt({
		placeholder: opts.placeholder,
		initialValue: '',
		input: opts.input,
		output: opts.output,
		render() {
			// Register event handlers only once
			if (!isEventsRegistered) {
				// Handle keyboard input and selection
				this.on('key', (key) => {
					// Start navigation mode with up/down arrows
					if (key === 'up' || key === 'down') {
						isNavigating = true;
					}

					// Toggle selection with space but only in navigation mode
					if (key === ' ' && isNavigating && filtered.length > 0) {
						toggleSelected();
						// Important: prevent the space from being added to the input
						return false;
					}

					// Allow typing again when user presses any other key
					if (key !== 'up' && key !== 'down' && key !== ' ' && key !== 'return') {
						isNavigating = false;
					}

					// Don't block other key events
					return;
				});

				// Handle cursor movement
				this.on('cursor', (key) => {
					if (filtered.length === 0) return;

					// Enter navigation mode
					isNavigating = true;

					if (key === 'up') {
						cursor = cursor > 0 ? cursor - 1 : filtered.length - 1;
					} else if (key === 'down') {
						cursor = cursor < filtered.length - 1 ? cursor + 1 : 0;
					}
				});

				// Register input change handler to update filtering
				this.on('value', () => {
					// Only update input when not in navigation mode
					if (!isNavigating) {
						const newInput = this.value || '';
						if (newInput !== input) {
							input = newInput;
							filterOptions(input);
						}
					}
				});

				isEventsRegistered = true;
			}

			// Handle initial filtering
			if (this.state === 'initial') {
				input = this.value || '';
				filterOptions(input);
			}

			// Handle submit state
			if (this.state === 'submit') {
				this.value = selectedValues as any;
			}

			// Title and symbol
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			// Selection counter
			const counter =
				selectedValues.length > 0 ? color.cyan(` (${selectedValues.length} selected)`) : '';

			// Mode indicator
			const modeIndicator = isNavigating ? color.yellow(' [navigation mode]') : '';

			// Search input display
			const searchText = isNavigating
				? color.dim(input) // Just show plain text when in navigation mode
				: this.value
					? this.valueWithCursor
					: color.inverse(color.hidden('_'));

			const matches =
				filtered.length !== opts.options.length
					? color.dim(` (${filtered.length} match${filtered.length === 1 ? '' : 'es'})`)
					: '';

			// Render prompt state
			switch (this.state) {
				case 'submit': {
					return `${title}${color.gray(S_BAR)}  ${color.dim(`${selectedValues.length} items selected`)}`;
				}
				case 'cancel': {
					return `${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(input))}`;
				}
				default: {
					// Instructions
					const instructions = isNavigating
						? [
								`${color.dim('Space:')} select, ${color.dim('Enter:')} confirm, ${color.dim('Type:')} exit navigation`,
							]
						: [`${color.dim('Type')} to filter, ${color.dim('↑/↓')} to navigate`];

					// No results message
					const noResults =
						filtered.length === 0 && input
							? [`${color.cyan(S_BAR)}  ${color.yellow('No matches found')}`]
							: [];

					// Get limited options for display
					const displayOptions = limitOptions({
						cursor,
						options: filtered,
						style: (option, active) => formatOption(option, active),
						maxItems: opts.maxItems,
						output: opts.output,
					});

					// Build the prompt display
					return [
						title,
						`${color.cyan(S_BAR)}  ${color.dim('Search:')} ${searchText}${matches}${modeIndicator}`,
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
