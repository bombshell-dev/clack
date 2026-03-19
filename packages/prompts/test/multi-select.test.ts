import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('multiselect (isCI = %s)', (isCI) => {
	let originalCI: string | undefined;
	let output: MockWritable;
	let input: MockReadable;

	beforeAll(() => {
		originalCI = process.env.CI;
		process.env.CI = isCI;
	});

	afterAll(() => {
		process.env.CI = originalCI;
	});

	beforeEach(() => {
		output = new MockWritable();
		input = new MockReadable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders message', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders multiple selected options', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }, { value: 'opt2' }],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0', 'opt1']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can cancel', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders validation errors', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});

		// try submit with nothing selected
		input.emit('keypress', '', { name: 'return' });
		// select and submit
		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can submit without selection when required = false', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			required: false,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual([]);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set cursorAt to preselect an option', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			cursorAt: 'opt1',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt1']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set initial values', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			initialValues: ['opt1'],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt1']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('maxItems renders a sliding window', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [...Array(12).keys()].map((k) => ({
				value: `opt${k}`,
			})),
			maxItems: 6,
			input,
			output,
		});

		for (let i = 0; i < 6; i++) {
			input.emit('keypress', '', { name: 'down' });
		}
		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt6']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('sliding window loops upwards', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [...Array(12).keys()].map((k) => ({
				value: `opt${k}`,
			})),
			maxItems: 6,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'up' });
		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt11']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('sliding window loops downwards', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [...Array(12).keys()].map((k) => ({
				value: `opt${k}`,
			})),
			maxItems: 6,
			input,
			output,
		});

		for (let i = 0; i < 12; i++) {
			input.emit('keypress', '', { name: 'down' });
		}
		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set custom labels', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [
				{ value: 'opt0', label: 'Option 0' },
				{ value: 'opt1', label: 'Option 1' },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can render option hints', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [
				{ value: 'opt0', hint: 'Hint 0' },
				{ value: 'opt1', hint: 'Hint 1' },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('shows hints for all selected options', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [
				{ value: 'opt0', hint: 'Hint 0' },
				{ value: 'opt1', hint: 'Hint 1' },
				{ value: 'opt2', hint: 'Hint 2' },
			],
			initialValues: ['opt0', 'opt1'],
			input,
			output,
		});

		// Check that both selected options show their hints
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0', 'opt1']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders multiple cancelled values', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }, { value: 'opt2' }],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.multiselect({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders disabled options', async () => {
		const result = prompts.multiselect({
			message: 'foo',
			options: [
				{ value: 'opt0', disabled: true },
				{ value: 'opt1' },
				{ value: 'opt2', disabled: true, hint: 'Hint 2' },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt1']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('wraps long messages', async () => {
		output.columns = 40;

		const result = prompts.multiselect({
			message: 'foo '.repeat(20).trim(),
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0']);
		expect(output.buffer).toMatchSnapshot();
	});

	test('wraps cancelled state with long options', async () => {
		output.columns = 40;

		const result = prompts.multiselect({
			message: 'foo',
			options: [
				{ value: 'opt0', label: 'Option 0 '.repeat(10).trim() },
				{ value: 'opt1', label: 'Option 1 '.repeat(10).trim() },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('wraps success state with long options', async () => {
		output.columns = 40;

		const result = prompts.multiselect({
			message: 'foo',
			options: [
				{ value: 'opt0', label: 'Option 0 '.repeat(10).trim() },
				{ value: 'opt1', label: 'Option 1 '.repeat(10).trim() },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'space' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['opt0']);
		expect(output.buffer).toMatchSnapshot();
	});
});
