import { updateSettings } from '@clack/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('password (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	afterEach(() => {
		updateSettings({ withGuide: true });
	});

	test('renders message', async () => {
		const result = prompts.password({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders masked value', async () => {
		const result = prompts.password({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders custom mask', async () => {
		const result = prompts.password({
			message: 'foo',
			mask: '*',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
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
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value', async () => {
		const result = prompts.password({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.password({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('clears input on error when clearOnError is true', async () => {
		const result = prompts.password({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			validate: (v) => (v === 'yz' ? undefined : 'Error'),
			clearOnError: true,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', 'z', { name: 'z' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('yz');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.password({
			message: 'foo',
			withGuide: false,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('global withGuide: false removes guide', async () => {
		updateSettings({ withGuide: false });

		const result = prompts.password({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
