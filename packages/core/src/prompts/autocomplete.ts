import Prompt, { type PromptOptions } from './prompt.js';

export interface AutocompleteOptions<T extends { value: any }>
	extends PromptOptions<AutocompletePrompt<T>> {
	options: T[];
	initialValue?: T['value'];
	maxItems?: number;
	filterFn?: (input: string, option: T) => boolean;
}

export default class AutocompletePrompt<T extends { value: any; label?: string }> extends Prompt {
	options: T[];
	filteredOptions: T[];
	cursor = 0;
	maxItems: number;
	filterFn: (input: string, option: T) => boolean;
	isNavigationMode = false; // Track if we're in navigation mode
	ignoreNextSpace = false; // Track if we should ignore the next space

	private filterOptions() {
		const input = this.value?.toLowerCase() ?? '';
		// Remember the currently selected value before filtering
		const previousSelectedValue = this.filteredOptions[this.cursor]?.value;

		// Filter options based on the current input
		this.filteredOptions = input
			? this.options.filter((option) => this.filterFn(input, option))
			: this.options;

		// Reset cursor to 0 by default when filtering changes
		this.cursor = 0;

		// Try to maintain the previously selected item if it still exists in filtered results
		if (previousSelectedValue !== undefined && this.filteredOptions.length > 0) {
			const newIndex = this.filteredOptions.findIndex((opt) => opt.value === previousSelectedValue);
			if (newIndex !== -1) {
				// Found the same item in new filtered results, keep it selected
				this.cursor = newIndex;
			}
		}
	}

	// Store both the search input and the selected value
	public get selectedValue(): T['value'] | undefined {
		return this.filteredOptions[this.cursor]?.value;
	}

	constructor(opts: AutocompleteOptions<T>) {
		super(opts, true);

		this.options = opts.options;
		this.filteredOptions = [...this.options];
		this.maxItems = opts.maxItems ?? 10;
		this.filterFn = opts.filterFn ?? this.defaultFilterFn;

		// Set initial value if provided
		if (opts.initialValue !== undefined) {
			const initialIndex = this.options.findIndex(({ value }) => value === opts.initialValue);
			if (initialIndex !== -1) {
				this.cursor = initialIndex;
			}
		}

		// Handle keyboard key presses
		this.on('key', (key) => {
			// Enter navigation mode with arrow keys
			if (key === 'up' || key === 'down') {
				this.isNavigationMode = true;
			}

			// Space key in navigation mode should be ignored for input
			if (key === ' ' && this.isNavigationMode) {
				this.ignoreNextSpace = true;
				return false; // Prevent propagation
			}

			// Exit navigation mode with non-navigation keys
			if (key !== 'up' && key !== 'down' && key !== 'return') {
				this.isNavigationMode = false;
			}
		});

		// Handle cursor movement
		this.on('cursor', (key) => {
			switch (key) {
				case 'up':
					this.isNavigationMode = true;
					this.cursor = this.cursor === 0 ? this.filteredOptions.length - 1 : this.cursor - 1;
					break;
				case 'down':
					this.isNavigationMode = true;
					this.cursor = this.cursor === this.filteredOptions.length - 1 ? 0 : this.cursor + 1;
					break;
			}
		});

		// Update filtered options when input changes
		this.on('value', (value) => {
			// Check if we need to ignore a space
			if (this.ignoreNextSpace && value?.endsWith(' ')) {
				// Remove the space and reset the flag
				this.value = value.replace(/\s+$/, '');
				this.ignoreNextSpace = false;
				return;
			}

			// In navigation mode, strip out any spaces
			if (this.isNavigationMode && value?.includes(' ')) {
				this.value = value.replace(/\s+/g, '');
				return;
			}

			// Normal filtering when not in navigation mode
			this.value = value;
			this.filterOptions();
		});
	}

	// Default filtering function
	private defaultFilterFn(input: string, option: T): boolean {
		const label = option.label ?? String(option.value);
		return label.toLowerCase().includes(input.toLowerCase());
	}
}
