import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as AutocompletePrompt } from '../../src/prompts/autocomplete.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('AutocompletePrompt', () => {
	let input: MockReadable;
	let output: MockWritable;
	const testOptions = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
		{ value: 'grape', label: 'Grape' },
		{ value: 'orange', label: 'Orange' },
	];

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders render() result', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('initial options match provided options', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();

		// Initial state should have all options
		expect(instance.filteredOptions.length).to.equal(testOptions.length);
		expect(instance.cursor).to.equal(0);
	});

	test('cursor navigation with event emitter', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();

		// Initial cursor should be at 0
		expect(instance.cursor).to.equal(0);

		// Directly trigger the cursor event with 'down'
		instance.emit('key', '', { name: 'down' });

		// After down event, cursor should be 1
		expect(instance.cursor).to.equal(1);

		// Trigger cursor event with 'up'
		instance.emit('key', '', { name: 'up' });

		// After up event, cursor should be back to 0
		expect(instance.cursor).to.equal(0);
	});

	test('initialValue selects correct option', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			initialValue: ['cherry'],
		});

		// The cursor should be initialized to the cherry index
		const cherryIndex = testOptions.findIndex((opt) => opt.value === 'cherry');
		expect(instance.cursor).to.equal(cherryIndex);

		// The selectedValue should be cherry
		expect(instance.selectedValues).to.deep.equal(['cherry']);
	});

	test('initialValue defaults to first option when non-multiple', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		expect(instance.cursor).to.equal(0);
		expect(instance.selectedValues).to.deep.equal(['apple']);
	});

	test('initialValue is empty when multiple', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			multiple: true,
		});

		expect(instance.cursor).to.equal(0);
		expect(instance.selectedValues).to.deep.equal([]);
	});

	test('filtering through user input', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();

		// Initial state should have all options
		expect(instance.filteredOptions.length).to.equal(testOptions.length);

		// Simulate typing 'a' by emitting keypress event
		input.emit('keypress', 'a', { name: 'a' });

		// Check that filtered options are updated to include options with 'a'
		expect(instance.filteredOptions.length).to.be.lessThan(testOptions.length);

		// Check that 'apple' is in the filtered options
		const hasApple = instance.filteredOptions.some((opt) => opt.value === 'apple');
		expect(hasApple).to.equal(true);
	});

	test('default filter function works correctly', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'p', { name: 'p' });

		expect(instance.filteredOptions).toEqual([
			{ value: 'apple', label: 'Apple' },
			{ value: 'grape', label: 'Grape' },
		]);

		input.emit('keypress', 'z', { name: 'z' });

		expect(instance.filteredOptions).toEqual([]);
	});

	test('submit without nav resolves to first option in non-multiple', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		const promise = instance.prompt();
		input.emit('keypress', '', { name: 'return' });
		const result = await promise;

		expect(instance.selectedValues).to.deep.equal(['apple']);
		expect(result).to.equal('apple');
	});

	test('submit without nav resolves to [] in multiple', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			multiple: true,
		});

		const promise = instance.prompt();
		input.emit('keypress', '', { name: 'return' });
		const result = await promise;

		expect(instance.selectedValues).to.deep.equal([]);
		expect(result).to.deep.equal([]);
	});

	// Sync filtered mode tests
	describe('sync filtered mode', () => {
		test('triggers initial search with empty query', () => {
			const filterFn = vi.fn((query: string, _signal?: AbortSignal) => {
				return testOptions.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
			});

			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: filterFn,
			});

			instance.prompt();

			// Should call with empty query and signal
			expect(filterFn).toHaveBeenCalledWith('', expect.any(AbortSignal));
		});

		test('calls filteredOptions function on user input', () => {
			const filterFn = vi.fn((query: string, _signal?: AbortSignal) => {
				return testOptions.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
			});

			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: filterFn,
			});

			instance.prompt();

			// Type 'a'
			input.emit('keypress', 'a', { name: 'a' });

			expect(filterFn).toHaveBeenCalledWith('a', expect.any(AbortSignal));
			expect(instance.filteredOptions).toEqual([
				{ value: 'apple', label: 'Apple' },
				{ value: 'banana', label: 'Banana' },
				{ value: 'grape', label: 'Grape' },
				{ value: 'orange', label: 'Orange' },
			]);
		});

		test('updates filteredOptions based on function result', () => {
			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: (query, _signal?) => {
					return testOptions.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
				},
			});

			instance.prompt();

			// Type 'app'
			input.emit('keypress', 'a', { name: 'a' });
			input.emit('keypress', 'p', { name: 'p' });
			input.emit('keypress', 'p', { name: 'p' });

			expect(instance.filteredOptions).toEqual([{ value: 'apple', label: 'Apple' }]);
		});
	});

	// Async filtered mode tests
	describe('async filtered mode', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		test('triggers initial search with empty query', async () => {
			const searchFn = vi.fn(async () => testOptions);

			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: searchFn,
			});

			const promise = instance.prompt();

			// Wait for initial search to be triggered
			await vi.runAllTimersAsync();

			// Should call with signal even on first call
			expect(searchFn).toHaveBeenCalledWith('', expect.any(AbortSignal));

			input.emit('keypress', '', { name: 'return' });
			await promise;
		});

		test('debounces search requests', async () => {
			const searchFn = vi.fn(async (query: string) => {
				return testOptions.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
			});

			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: searchFn,
				debounce: 300,
			});

			const promise = instance.prompt();

			// Wait for initial search
			await vi.runAllTimersAsync();

			// Type 'a'
			input.emit('keypress', 'a', { name: 'a' });

			// Search should not have been called yet (debouncing)
			expect(searchFn).toHaveBeenCalledTimes(1); // Only initial search

			// Wait for debounce
			await vi.advanceTimersByTimeAsync(300);
			await vi.runAllTimersAsync();

			// Now search should have been called
			expect(searchFn).toHaveBeenCalledWith('a', expect.any(AbortSignal));

			input.emit('keypress', '', { name: 'return' });
			await promise;
		});

		test('sets isLoading flag during search', async () => {
			let resolveSearch!: (value: any) => void;
			const searchPromise = new Promise((resolve) => {
				resolveSearch = resolve;
			});

			const searchFn = vi.fn(async () => {
				await searchPromise;
				return testOptions;
			});

			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: searchFn,
			});

			const promise = instance.prompt();

			// Advance timers to trigger initial search
			await vi.runOnlyPendingTimersAsync();

			// Should be loading
			expect(instance.isLoading).to.equal(true);

			// Resolve the search
			resolveSearch?.(testOptions);
			await vi.runAllTimersAsync();

			// Should not be loading anymore
			expect(instance.isLoading).to.equal(false);

			input.emit('keypress', '', { name: 'return' });
			await promise;
		});

		test('handles search errors', async () => {
			const error = new Error('Search failed');
			const searchFn = vi.fn(async () => {
				throw error;
			});

			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: searchFn,
			});

			const promise = instance.prompt();

			// Wait for initial search
			await vi.runAllTimersAsync();

			// Error should be set
			expect(instance.searchError).to.equal(error);
			expect(instance.isLoading).to.equal(false);

			input.emit('keypress', '', { name: 'return' });
			await promise;
		});

		test('cancels in-flight requests when query changes', async () => {
			const searchFn = vi.fn(async (query: string, signal?: AbortSignal) => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				if (signal?.aborted) throw new Error('Aborted');
				return testOptions.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
			});

			const instance = new AutocompletePrompt({
				input,
				output,
				render: () => 'foo',
				filteredOptions: searchFn,
				debounce: 100,
			});

			const promise = instance.prompt();

			// Wait for initial search
			await vi.runAllTimersAsync();

			// Type 'a'
			input.emit('keypress', 'a', { name: 'a' });

			// Wait for debounce
			await vi.advanceTimersByTimeAsync(100);

			// Before first search completes, type another character
			input.emit('keypress', 'p', { name: 'p' });

			// Wait for debounce
			await vi.advanceTimersByTimeAsync(100);

			// The first search should have been aborted
			expect(searchFn).toHaveBeenCalledWith('a', expect.any(AbortSignal));
			expect(searchFn).toHaveBeenCalledWith('ap', expect.any(AbortSignal));

			// Wait for all timers to complete
			await vi.runAllTimersAsync();

			input.emit('keypress', '', { name: 'return' });
			await promise;
		});
	});
});
