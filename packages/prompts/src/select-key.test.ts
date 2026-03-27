import { updateSettings } from '@clack/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('text (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	afterEach(() => {
		updateSettings({ withGuide: true });
	});

	test('renders message with options', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe(undefined);
	});

	test('selects option by keypress', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'b', { name: 'b' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('b');
	});

	test('can cancel by pressing escape', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(prompts.isCancel(value)).toBe(true);
	});

	test('options are case-insensitive by default', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'A' },
				{ label: 'Option B', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('A');
	});

	test('input is case-insensitive by default', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a', shift: true });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('a');
	});

	test('caseSensitive: true makes options case-sensitive', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'A' },
				{ label: 'Option B', value: 'b' },
			],
			caseSensitive: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a' });
		mocks.input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(prompts.isCancel(value)).toBe(true);
	});

	test('caseSensitive: true makes input case-sensitive', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option a', value: 'a' },
				{ label: 'Option A', value: 'A' },
				{ label: 'Option B', value: 'b' },
			],
			caseSensitive: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a', shift: true });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('A');
	});

	test('long option labels are wrapped correctly', async () => {
		mocks.output.columns = 40;

		const result = prompts.selectKey({
			message: 'Select an option:',
			options: [
				{
					label: 'This is a somewhat long label '.repeat(10).trimEnd(),
					value: 'a',
				},
				{ label: 'Short label', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('a');
	});

	test('long cancelled labels are wrapped correctly', async () => {
		mocks.output.columns = 40;

		const result = prompts.selectKey({
			message: 'Select an option:',
			options: [
				{
					label: 'This is a somewhat long label '.repeat(10).trimEnd(),
					value: 'a',
				},
				{ label: 'Short label', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'escape' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			withGuide: false,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('global withGuide: false removes guide', async () => {
		updateSettings({ withGuide: false });

		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('long submitted labels are wrapped correctly', async () => {
		mocks.output.columns = 40;

		const result = prompts.selectKey({
			message: 'Select an option:',
			options: [
				{
					label: 'This is a somewhat long label '.repeat(10).trimEnd(),
					value: 'a',
				},
				{ label: 'Short label', value: 'b' },
			],
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'a', { name: 'a' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
