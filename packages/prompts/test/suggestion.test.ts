import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('text (isCI = %s)', (isCI) => {
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
		const result = prompts.suggestion({
			message: 'foo',
			input,
			output,
			suggest: () => [],
		});

		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders and apply (<tab>) suggestion', async () => {
		const result = prompts.suggestion({
			message: 'foo',
			suggest: () => ['bar'],
			input,
			output,
		});

		input.emit('keypress', '\t', { name: 'tab' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();

		expect(value).toBe('bar');
	});

	test('can cancel', async () => {
		const result = prompts.suggestion({
			message: 'foo',
			suggest: () => [],
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value if one set', async () => {
		const result = prompts.suggestion({
			message: 'foo',
			input,
			output,
			suggest: () => ['xyz'],
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.suggestion({
			message: 'foo',
			suggest: () => ['xyz'],
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(output.buffer).toMatchSnapshot();
	});

	test('initialValue sets the value', async () => {
		const result = prompts.suggestion({
			message: 'foo',
			initialValue: 'bar',
			suggest: () => [],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear', async () => {
		const result = prompts.suggestion({
			message: 'foo',
			suggest: () => ['xyz'],
			validate: (val) => (val !== 'xy' ? 'should be xy' : undefined),
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear (using Error)', async () => {
		const result = prompts.suggestion({
			message: 'foo',
			suggest: () => ['xyz'],
			validate: (val) => (val !== 'xy' ? new Error('should be xy') : undefined),
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(output.buffer).toMatchSnapshot();
	});
});
