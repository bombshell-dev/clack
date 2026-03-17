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

	test('options function skips default filter when no custom filter provided', () => {
		const optionsFn = function (this: any) {
			const input = this.userInput || '';
			if (!input) return testOptions;
			return testOptions.filter((opt) => opt.value.startsWith(input));
		};

		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: optionsFn,
		});

		instance.prompt();

		// Type 'b' - options function returns only 'banana'
		input.emit('keypress', 'b', { name: 'b' });

		// Should use the options function result as-is, no additional filtering
		expect(instance.filteredOptions).toEqual([
			{ value: 'banana', label: 'Banana' },
		]);
	});

	test('options function applies custom filter when both are provided', () => {
		const optionsFn = function (this: any) {
			return testOptions;
		};

		const customFilter = (search: string, opt: { value: string; label?: string }) => {
			return opt.value.includes(search);
		};

		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: optionsFn,
			filter: customFilter,
		});

		instance.prompt();

		// Type 'an' - custom filter should run on top of options function result
		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'n', { name: 'n' });

		// Custom filter: 'an' matches banana and orange
		expect(instance.filteredOptions).toEqual([
			{ value: 'banana', label: 'Banana' },
			{ value: 'orange', label: 'Orange' },
		]);
	});
});
