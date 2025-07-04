import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('number (isCI = %s)', (isCI) => {
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
		const result = prompts.number({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders placeholder if set', async () => {
		const result = prompts.number({
			message: 'foo',
			placeholder: 5,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe(0);
	});

	test('can cancel', async () => {
		const result = prompts.number({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value if one set', async () => {
		const result = prompts.number({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', '1', { name: '1' });
		input.emit('keypress', '2', { name: '2' });
		input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.number({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', '1', { name: '1' });
		input.emit('keypress', '2', { name: '2' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(12);
		expect(output.buffer).toMatchSnapshot();
	});

	test('defaultValue sets the value but does not render', async () => {
		const result = prompts.number({
			message: 'foo',
			defaultValue: 10,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(10);
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear', async () => {
		const result = prompts.number({
			message: 'foo',
			validate: (val) => (val < 3 ? 'should be greater than 3' : undefined),
			input,
			output,
		});

		input.emit('keypress', '1', { name: '1' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', '0', { name: '0' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(10);
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear (using Error)', async () => {
		const result = prompts.number({
			message: 'foo',
			validate: (val) => (val < 3 ? new Error('should be greater than 3') : undefined),
			input,
			output,
		});

		input.emit('keypress', '1', { name: '1' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', '0', { name: '0' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(10);
		expect(output.buffer).toMatchSnapshot();
	});

	test('placeholder is not used as value when pressing enter', async () => {
		const result = prompts.number({
			message: 'foo',
			placeholder: '  (hit Enter to use default)',
			defaultValue: 7,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(7);
		expect(output.buffer).toMatchSnapshot();
	});

	test('0 when no value and no default', async () => {
		const result = prompts.number({
			message: 'foo',
			placeholder: '  (hit Enter to use default)',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(0);
		expect(output.buffer).toMatchSnapshot();
	});
	
	test('warn when use invalid number value', async () => {
		const result = prompts.number({
			message: 'foo',
			placeholder: 1,
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', '', { name: 'backspace' });
		input.emit('keypress', '1', { name: '1' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(1);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.number({
			message: 'foo',
			input,
			output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});
});
