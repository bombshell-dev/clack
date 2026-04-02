import { cursor } from 'sisteransi';
import { beforeEach, describe, expect, test } from 'vitest';
import { default as AutocompletePrompt } from './autocomplete.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe('AutocompletePrompt', () => {
	let mocks: Mocks<{ input: true; output: true }>;
	const testOptions = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
		{ value: 'grape', label: 'Grape' },
		{ value: 'orange', label: 'Orange' },
	];

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('renders render() result', () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
		});
		instance.prompt();
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('initial options match provided options', () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
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
			input: mocks.input,
			output: mocks.output,
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
			input: mocks.input,
			output: mocks.output,
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
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
		});

		expect(instance.cursor).to.equal(0);
		expect(instance.selectedValues).to.deep.equal(['apple']);
	});

	test('initialValue is empty when multiple', () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
			multiple: true,
		});

		expect(instance.cursor).to.equal(0);
		expect(instance.selectedValues).to.deep.equal([]);
	});

	test('filtering through user input', () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();

		// Initial state should have all options
		expect(instance.filteredOptions.length).to.equal(testOptions.length);

		// Simulate typing 'a' by emitting keypress event
		mocks.input.emit('keypress', 'a', { name: 'a' });

		// Check that filtered options are updated to include options with 'a'
		expect(instance.filteredOptions.length).to.be.lessThan(testOptions.length);

		// Check that 'apple' is in the filtered options
		const hasApple = instance.filteredOptions.some((opt) => opt.value === 'apple');
		expect(hasApple).to.equal(true);
	});

	test('default filter function works correctly', () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
		});

		instance.prompt();

		mocks.input.emit('keypress', 'a', { name: 'a' });
		mocks.input.emit('keypress', 'p', { name: 'p' });

		expect(instance.filteredOptions).toEqual([
			{ value: 'apple', label: 'Apple' },
			{ value: 'grape', label: 'Grape' },
		]);

		mocks.input.emit('keypress', 'z', { name: 'z' });

		expect(instance.filteredOptions).toEqual([]);
	});

	test('submit without nav resolves to first option in non-multiple', async () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
		});

		const promise = instance.prompt();
		mocks.input.emit('keypress', '', { name: 'return' });
		const result = await promise;

		expect(instance.selectedValues).to.deep.equal(['apple']);
		expect(result).to.equal('apple');
	});

	test('submit without nav resolves to [] in multiple', async () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
			multiple: true,
		});

		const promise = instance.prompt();
		mocks.input.emit('keypress', '', { name: 'return' });
		const result = await promise;

		expect(instance.selectedValues).to.deep.equal([]);
		expect(result).to.deep.equal([]);
	});

	test('Tab with empty input and placeholder fills input and submit returns matching option', async () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
			placeholder: 'apple',
		});

		const promise = instance.prompt();
		mocks.input.emit('keypress', '\t', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });
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
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: () => dynamicOptions,
		});

		instance.prompt();

		mocks.input.emit('keypress', 'z', { name: 'z' });

		expect(instance.filteredOptions).toEqual(dynamicOptions);
	});

	test('options as function applies user-provided filter', () => {
		const dynamicOptions = [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' },
			{ value: 'cherry', label: 'Cherry' },
		];
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: () => dynamicOptions,
			filter: (search, opt) => (opt.label ?? '').toLowerCase().endsWith(search.toLowerCase()),
		});

		instance.prompt();

		mocks.input.emit('keypress', 'a', { name: 'a' });

		// 'endsWith' matches Banana but not Apple or Cherry
		expect(instance.filteredOptions).toEqual([{ value: 'banana', label: 'Banana' }]);
	});

	test('Tab with non-matching placeholder does not fill input', async () => {
		const instance = new AutocompletePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: testOptions,
			placeholder: 'Type to search...',
		});

		instance.prompt();
		mocks.input.emit('keypress', '\t', { name: 'tab' });

		// Placeholder does not match any option, so input must not be filled with placeholder
		expect(instance.userInput).not.to.equal('Type to search...');
	});
});
