import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from './index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('select (isCI = %s)', (isCI) => {
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

	test('renders options and message', async () => {
		const result = prompts.select({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('opt0');
		expect(output.buffer).toMatchSnapshot();
	});

	test('down arrow selects next option', async () => {
		const result = prompts.select({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('opt1');
		expect(output.buffer).toMatchSnapshot();
	});

	test('up arrow selects previous option', async () => {
		const result = prompts.select({
			message: 'foo',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'down' });
		input.emit('keypress', '', { name: 'up' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('opt0');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can cancel', async () => {
		const result = prompts.select({
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

	test('renders option labels', async () => {
		const result = prompts.select({
			message: 'foo',
			options: [
				{ value: 'opt0', label: 'Option 0' },
				{ value: 'opt1', label: 'Option 1' },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('opt0');
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders option hints', async () => {
		const result = prompts.select({
			message: 'foo',
			options: [
				{ value: 'opt0', hint: 'Hint 0' },
				{ value: 'opt1', hint: 'Hint 1' },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('opt0');
		expect(output.buffer).toMatchSnapshot();
	});
});
