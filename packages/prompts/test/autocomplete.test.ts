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
	});

	test('shows placeholder when provided', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			placeholder: 'Type to search...',
			input,
			output,
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('limits displayed options when maxItems is set', async () => {
		const result = autocomplete({
			message: 'Select a fruit',
			options: testOptions,
			maxItems: 2,
			input,
			output,
		});

		expect(output.buffer).toMatchSnapshot();
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
});
