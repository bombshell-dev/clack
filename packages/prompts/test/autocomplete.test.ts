import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { autocomplete } from '../src/autocomplete.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe('autocomplete', () => {
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

	test('renders initial UI with message and instructions', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input,
			output,
		});

		expect(output.buffer).toMatchSnapshot();
		input.emit('keypress', '', { name: 'return' });
		await result;
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
			input,
			output,
		});

		expect(output.buffer).toMatchSnapshot();
		input.emit('keypress', '', { name: 'return' });
		await result;
	});

	test('shows no matches message when search has no results', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input,
			output,
		});

		// Type something that won't match
		input.emit('keypress', 'z', { name: 'z' });
		expect(output.buffer).toMatchSnapshot();
		input.emit('keypress', '', { name: 'return' });
		await result;
	});

	test('shows hint when option has hint and is focused', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: [...testOptions, { value: 'kiwi', label: 'Kiwi', hint: 'New Zealand' }],
			input,
			output,
		});

		// Navigate to the option with hint
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'down' });
		expect(output.buffer).toMatchSnapshot();
		input.emit('keypress', '', { name: 'return' });
		await result;
	});

	test('shows selected value in submit state', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input,
			output,
		});

		// Select an option and submit
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;
		expect(value).toBe('banana');
		expect(output.buffer).toMatchSnapshot();
	});

	test('shows strikethrough in cancel state', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			input,
			output,
		});

		// Cancel with Ctrl+C
		input.emit('keypress', '\x03', { name: 'c' });

		const value = await result;
		expect(typeof value === 'symbol').toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders placeholder if set', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			placeholder: 'Type to search...',
			options: testOptions,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });
		const value = await result;
		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe('apple');
	});

	test('supports initialValue', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			initialValue: 'cherry',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });
		const value = await result;

		expect(value).toBe('cherry');
		expect(output.buffer).toMatchSnapshot();
	});
});
