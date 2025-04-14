import Prompt, { type PromptOptions } from './prompt.js';

export interface AutocompleteOptions<T extends { value: any }> extends PromptOptions<AutocompletePrompt<T>> {
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

  private get _value() {
    return this.filteredOptions[this.cursor];
  }

  private filterOptions() {
    const input = this.value?.toLowerCase() ?? '';
    // Remember the currently selected value before filtering
    const previousSelectedValue = this.filteredOptions[this.cursor]?.value;
    
    // Filter options based on the current input
    this.filteredOptions = input
      ? this.options.filter(option => this.filterFn(input, option))
      : this.options;
    
    // Reset cursor to 0 by default when filtering changes
    this.cursor = 0;
    
    // Try to maintain the previously selected item if it still exists in filtered results
    if (previousSelectedValue !== undefined && this.filteredOptions.length > 0) {
      const newIndex = this.filteredOptions.findIndex(opt => opt.value === previousSelectedValue);
      if (newIndex !== -1) {
        // Found the same item in new filtered results, keep it selected
        this.cursor = newIndex;
      }
    }
  }

  private changeValue() {
    if (this.filteredOptions.length > 0) {
      // Set the selected option's value
      this.selectedValue = this._value.value;
    }
  }

  // Store both the search input and the selected value
  public selectedValue: any;

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
        this.selectedValue = this.options[initialIndex].value;
      }
    }

    // Handle cursor movement
    this.on('cursor', (key) => {
      switch (key) {
        case 'up':
          this.cursor = this.cursor === 0 ? this.filteredOptions.length - 1 : this.cursor - 1;
          break;
        case 'down':
          this.cursor = this.cursor === this.filteredOptions.length - 1 ? 0 : this.cursor + 1;
          break;
      }
      this.changeValue();
    });

    // Update filtered options when input changes
    this.on('value', (value) => {
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