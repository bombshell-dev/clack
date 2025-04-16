import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from './index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('password (isCI = %s)', (isCI) => {
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
		const result = prompts.password({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders masked value', async () => {
		const result = prompts.password({
			message: 'foo',
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

	test('renders custom mask', async () => {
		const result = prompts.password({
			message: 'foo',
			mask: '*',
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders and clears validation errors', async () => {
		const result = prompts.password({
			message: 'foo',
			validate: (value) => {
				if (value.length < 2) {
					return 'Password must be at least 2 characters';
				}

				return undefined;
			},
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value', async () => {
		const result = prompts.password({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});
});
