import { updateSettings } from '@clack/core';
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
		updateSettings({ withGuide: true });
	});

	test('renders message with options', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe(undefined);
	});

	test('selects option by keypress', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', 'b', { name: 'b' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe('b');
	});

	test('can cancel by pressing escape', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(prompts.isCancel(value)).toBe(true);
	});

	test('options are case-insensitive by default', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'A' },
				{ label: 'Option B', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe('A');
	});

	test('input is case-insensitive by default', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a', shift: true });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
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
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
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
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a', shift: true });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe('A');
	});

	test('long option labels are wrapped correctly', async () => {
		output.columns = 40;

		const result = prompts.selectKey({
			message: 'Select an option:',
			options: [
				{
					label: 'This is a somewhat long label '.repeat(10).trimEnd(),
					value: 'a',
				},
				{ label: 'Short label', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe('a');
	});

	test('long cancelled labels are wrapped correctly', async () => {
		output.columns = 40;

		const result = prompts.selectKey({
			message: 'Select an option:',
			options: [
				{
					label: 'This is a somewhat long label '.repeat(10).trimEnd(),
					value: 'a',
				},
				{ label: 'Short label', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', '', { name: 'escape' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			withGuide: false,
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('global withGuide: false removes guide', async () => {
		updateSettings({ withGuide: false });

		const result = prompts.selectKey({
			message: 'foo',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('long submitted labels are wrapped correctly', async () => {
		output.columns = 40;

		const result = prompts.selectKey({
			message: 'Select an option:',
			options: [
				{
					label: 'This is a somewhat long label '.repeat(10).trimEnd(),
					value: 'a',
				},
				{ label: 'Short label', value: 'b' },
			],
			input,
			output,
		});

		input.emit('keypress', 'a', { name: 'a' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});
});
