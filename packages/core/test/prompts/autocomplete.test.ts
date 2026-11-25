import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as AutocompletePrompt } from '../../src/prompts/autocomplete.js';
import { isCancel } from '../../src/utils/index.js';
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

	test('Tab with empty input and placeholder fills input and submit returns matching option', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			placeholder: 'apple',
		});

		const promise = instance.prompt();
		input.emit('keypress', '\t', { name: 'tab' });
		input.emit('keypress', '', { name: 'return' });
		const result = await promise;

		expect(instance.userInput).to.equal('apple');
		expect(result).to.equal('apple');
	});

	test('options as function skips default filter', () => {
		const dynamicOptions = [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' },
		];
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: () => dynamicOptions,
		});

		instance.prompt();

		input.emit('keypress', 'z', { name: 'z' });

		expect(instance.filteredOptions).toEqual(dynamicOptions);
	});

	test('options as function applies user-provided filter', () => {
		const dynamicOptions = [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' },
			{ value: 'cherry', label: 'Cherry' },
		];
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: () => dynamicOptions,
			filter: (search, opt) => (opt.label ?? '').toLowerCase().endsWith(search.toLowerCase()),
		});

		instance.prompt();

		input.emit('keypress', 'a', { name: 'a' });

		// 'endsWith' matches Banana but not Apple or Cherry
		expect(instance.filteredOptions).toEqual([{ value: 'banana', label: 'Banana' }]);
	});

	test('Tab with non-matching placeholder does not fill input', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			placeholder: 'Type to search...',
		});

		instance.prompt();
		input.emit('keypress', '\t', { name: 'tab' });

		// Placeholder does not match any option, so input must not be filled with placeholder
		expect(instance.userInput).not.to.equal('Type to search...');
	});

	test('completeOnTab fills input with focused option and submit returns it', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			completeOnTab: true,
		});

		const promise = instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'n', { name: 'n' });
		input.emit('keypress', '\t', { name: 'tab' });
		input.emit('keypress', '', { name: 'return' });
		const result = await promise;

		expect(instance.userInput).to.equal('banana');
		expect(result).to.equal('banana');
	});

	test('completeOnTab with no matches leaves input unchanged', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			completeOnTab: true,
		});

		instance.prompt();
		input.emit('keypress', 'z', { name: 'z' });
		input.emit('keypress', 'z', { name: 'z' });
		input.emit('keypress', 'z', { name: 'z' });
		input.emit('keypress', '\t', { name: 'tab' });

		expect(instance.userInput).to.equal('zzz');
	});

	test('Tab does not complete when completeOnTab is not set', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'n', { name: 'n' });
		input.emit('keypress', '\t', { name: 'tab' });

		expect(instance.userInput).to.equal('ban');
	});

	test('escape clears the search input instead of cancelling', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		const promise = instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', 'a', { name: 'a' });
		expect(instance.filteredOptions.length).to.equal(1);

		input.emit('keypress', '', { name: 'escape' });

		expect(instance.state).to.equal('active');
		expect(instance.userInput).to.equal('');
		expect(instance.filteredOptions.length).to.equal(testOptions.length);

		input.emit('keypress', 'c', { name: 'c' });
		expect(instance.userInput).to.equal('c');

		input.emit('keypress', '', { name: 'return' });
		expect(await promise).to.equal('cherry');
	});

	test('escape cancels once the search input is empty', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		const promise = instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'escape' });
		input.emit('keypress', '', { name: 'escape' });

		expect(isCancel(await promise)).to.equal(true);
		expect(instance.state).to.equal('cancel');
	});

	test('escape clears the whole search input when the cursor is not at the end', () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'n', { name: 'n' });
		input.emit('keypress', '', { name: 'left' });
		input.emit('keypress', '', { name: 'left' });
		input.emit('keypress', '', { name: 'escape' });

		expect(instance.userInput).to.equal('');

		input.emit('keypress', 'g', { name: 'g' });
		expect(instance.userInput).to.equal('g');
	});

	test('escape keeps selections when clearing the search input in multiple mode', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			multiple: true,
		});

		const promise = instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '\t', { name: 'tab' });
		input.emit('keypress', '', { name: 'escape' });
		input.emit('keypress', 'c', { name: 'c' });
		input.emit('keypress', '\t', { name: 'tab' });
		input.emit('keypress', '', { name: 'return' });

		expect(await promise).to.deep.equal(['banana', 'cherry']);
	});

	test('ctrl-c cancels even when the search input has text', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
		});

		const promise = instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '\x03', { name: 'c', ctrl: true });

		expect(isCancel(await promise)).to.equal(true);
	});

	test('escape cancels with search input when clearOnCancel is false', async () => {
		const instance = new AutocompletePrompt({
			input,
			output,
			render: () => 'foo',
			options: testOptions,
			clearOnCancel: false,
		});

		const promise = instance.prompt();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'escape' });

		expect(isCancel(await promise)).to.equal(true);
	});
});
