import { updateSettings } from '@clack/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
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
		updateSettings({ withGuide: true });
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
				if (!value || value.length < 2) {
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

		const value = await result;

		expect(value).toBe('xy');
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

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.password({
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

	test('clears input on error when clearOnError is true', async () => {
		const result = prompts.password({
			message: 'foo',
			input,
			output,
			validate: (v) => (v === 'yz' ? undefined : 'Error'),
			clearOnError: true,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', 'z', { name: 'z' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('yz');
		expect(output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.password({
			message: 'foo',
			withGuide: false,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('global withGuide: false removes guide', async () => {
		updateSettings({ withGuide: false });

		const result = prompts.password({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});
});
