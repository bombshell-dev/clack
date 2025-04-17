import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('confirm (isCI = %s)', (isCI) => {
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

	test('renders message with choices', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders custom active choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			active: 'bleep',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders custom inactive choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			inactive: 'bleep',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('right arrow moves to next choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'right', { name: 'right' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(false);
		expect(output.buffer).toMatchSnapshot();
	});

	test('left arrow moves to previous choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'right', { name: 'right' });
		input.emit('keypress', 'left', { name: 'left' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can cancel', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set initialValue', async () => {
		const result = prompts.confirm({
			message: 'foo',
			initialValue: false,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(false);
		expect(output.buffer).toMatchSnapshot();
	});
});
