import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { autocomplete, autocompleteMultiselect } from './autocomplete.js';
import { isCancel, updateSettings } from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe('autocomplete', () => {
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

	afterEach(() => {
		updateSettings({ withGuide: true });
	});

	test('renders initial UI with message and instructions', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });
		await result;
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('limits displayed options when maxItems is set', async () => {
		const options = [];
		for (let i = 0; i < 10; i++) {
			options.push({ value: `option ${i}`, label: `Option ${i}` });
		}

		const result = autocomplete({
			message: 'Select an option',
			options,
			maxItems: 6,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });
		await result;
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('shows no matches message when search has no results', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		// Type something that won't match
		mocks.input.emit('keypress', 'z', { name: 'z' });
		mocks.input.emit('keypress', '', { name: 'return' });
		await result;
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('shows hint when option has hint and is focused', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: [...testOptions, { value: 'kiwi', label: 'Kiwi', hint: 'New Zealand' }],
			input: mocks.input,
			output: mocks.output,
		});

		// Navigate to the option with hint
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'return' });
		await result;
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('shows selected value in submit state', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		// Select an option and submit
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toBe('banana');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('shows strikethrough in cancel state', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		// Cancel with Ctrl+C
		mocks.input.emit('keypress', '\x03', { name: 'c', ctrl: true });

		const value = await result;
		expect(typeof value === 'symbol').toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders placeholder if set', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			placeholder: 'Type to search...',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });
		const value = await result;
		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('apple');
	});

	test('Tab with placeholder fills input and Enter submits matching option', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			placeholder: 'apple',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '\t', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });
		const value = await result;
		expect(value).toBe('apple');
	});

	test('Tab with non-matching placeholder does not fill input', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			placeholder: 'Type to search...',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '\t', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });
		const value = await result;
		// Tab did not fill input with placeholder (no option matches), so Enter submits first option
		expect(value).toBe('apple');
	});

	test('supports initialValue', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			initialValue: 'cherry',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });
		const value = await result;

		expect(value).toBe('cherry');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = autocomplete({
			message: 'foo',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('autocompleteMultiselect respects withGuide: false', async () => {
		const result = autocompleteMultiselect({
			message: 'Select fruits',
			options: testOptions,
			withGuide: false,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['banana']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('autocompleteMultiselect respects global withGuide: false', async () => {
		updateSettings({ withGuide: false });

		const result = autocompleteMultiselect({
			message: 'Select fruits',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['banana']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders bottom ellipsis when items do not fit', async () => {
		mocks.output.rows = 5;

		const options = [
			{
				value: Array.from({ length: 4 })
					.map((_val, index) => `Line ${index}`)
					.join('\n'),
			},
			{
				value: 'Option 2',
			},
		];

		const result = autocomplete({
			message: 'Select an option',
			options,
			maxItems: 5,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });
		await result;
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders top ellipsis when scrolled down and its do not fit', async () => {
		mocks.output.rows = 5;

		const options = [
			{
				value: 'option1',
				label: Array.from({ length: 4 })
					.map((_val, index) => `Line ${index}`)
					.join('\n'),
			},
			{
				value: 'option2',
				label: 'Option 2',
			},
		];

		const result = autocomplete({
			message: 'Select an option',
			options,
			initialValue: 'option2',
			maxItems: 5,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });
		await result;
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('placeholder is shown if set', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			placeholder: 'Type to search...',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'g', { name: 'g' });
		mocks.input.emit('keypress', '', { name: 'return' });
		const value = await result;
		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('grape');
	});

	test('displays disabled options correctly', async () => {
		const optionsWithDisabled = [...testOptions, { value: 'kiwi', label: 'Kiwi', disabled: true }];
		const result = autocomplete({
			message: 'Select a fruit',
			options: optionsWithDisabled,
			input: mocks.input,
			output: mocks.output,
		});

		for (let i = 0; i < 5; i++) {
			mocks.input.emit('keypress', '', { name: 'down' });
		}
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toBe('apple');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('cannot select disabled options when only one left', async () => {
		const optionsWithDisabled = [...testOptions, { value: 'kiwi', label: 'Kiwi', disabled: true }];
		const result = autocomplete({
			message: 'Select a fruit',
			options: optionsWithDisabled,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'k', { name: 'k' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toBe(undefined);
		expect(mocks.output.buffer).toMatchSnapshot();
	});
});

describe('autocompleteMultiselect', () => {
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

	test('renders error when empty selection & required is true', async () => {
		const result = autocompleteMultiselect({
			message: 'Select a fruit',
			options: testOptions,
			required: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', '', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });
		await result;
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = autocompleteMultiselect({
			message: 'foo',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can use navigation keys to select options', async () => {
		const result = autocompleteMultiselect({
			message: 'Select fruits',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toEqual(['banana', 'cherry']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('supports custom filter function', async () => {
		const result = autocompleteMultiselect({
			message: 'Select fruits',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
			// Custom filter that only matches exact prefix
			filter: (search, option) => {
				const label = option.label ?? String(option.value ?? '');
				return label.toLowerCase().startsWith(search.toLowerCase());
			},
		});

		// Type 'a' - should match 'Apple' only (not 'Banana' which contains 'a')
		mocks.input.emit('keypress', 'a', { name: 'a' });
		mocks.input.emit('keypress', '', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toEqual(['apple']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('displays disabled options correctly', async () => {
		const optionsWithDisabled = [...testOptions, { value: 'kiwi', label: 'Kiwi', disabled: true }];
		const result = autocompleteMultiselect({
			message: 'Select a fruit',
			options: optionsWithDisabled,
			input: mocks.input,
			output: mocks.output,
		});

		for (let i = 0; i < testOptions.length; i++) {
			mocks.input.emit('keypress', '', { name: 'down' });
		}
		mocks.input.emit('keypress', '', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toEqual(['apple']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('cannot select disabled options when only one left', async () => {
		const optionsWithDisabled = [...testOptions, { value: 'kiwi', label: 'Kiwi', disabled: true }];
		const result = autocompleteMultiselect({
			message: 'Select a fruit',
			options: optionsWithDisabled,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'k', { name: 'k' });
		mocks.input.emit('keypress', '', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toEqual([]);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('Tab with placeholder fills input; Enter submits current selection', async () => {
		const result = autocompleteMultiselect({
			message: 'Select fruits',
			placeholder: 'apple',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '\t', { name: 'tab' });
		mocks.input.emit('keypress', '', { name: 'return' });
		const value = await result;
		expect(value).toEqual([]);
	});
});

describe('autocomplete with custom filter', () => {
	let mocks: Mocks<{ input: true; output: true }>;
	const testOptions = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
	];

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('uses custom filter function when provided', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
			// Custom filter that only matches exact prefix
			filter: (search, option) => {
				const label = option.label ?? String(option.value ?? '');
				return label.toLowerCase().startsWith(search.toLowerCase());
			},
		});

		// Type 'a' - should match 'Apple' only (not 'Banana' which contains 'a')
		mocks.input.emit('keypress', 'a', { name: 'a' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toBe('apple');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('falls back to default filter when not provided', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input: mocks.input,
			output: mocks.output,
		});

		// Type 'a' - default filter should match both 'Apple' and 'Banana'
		mocks.input.emit('keypress', 'a', { name: 'a' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;
		// First match should be selected
		expect(value).toBe('apple');
		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
