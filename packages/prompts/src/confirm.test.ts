import { updateSettings } from '@clack/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('confirm (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	afterEach(() => {
		updateSettings({ withGuide: true });
	});

	test('renders message with choices', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders custom active choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			active: 'bleep',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders custom inactive choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			inactive: 'bleep',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders options in vertical alignment', async () => {
		const result = prompts.confirm({
			message: 'foo',
			vertical: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('right arrow moves to next choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'right', { name: 'right' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(false);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('left arrow moves to previous choice', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'right', { name: 'right' });
		mocks.input.emit('keypress', 'left', { name: 'left' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can cancel', async () => {
		const result = prompts.confirm({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can set initialValue', async () => {
		const result = prompts.confirm({
			message: 'foo',
			initialValue: false,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe(false);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.confirm({
			message: 'yes?',
			input: mocks.input,
			output: mocks.output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.confirm({
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

		const result = prompts.confirm({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders multi-line messages correctly', async () => {
		const result = prompts.confirm({
			message: 'foo\nbar\nbaz',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
