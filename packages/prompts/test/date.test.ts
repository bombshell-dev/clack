import { updateSettings } from '@clack/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('date (isCI = %s)', (isCI) => {
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
		const result = prompts.date({
			message: 'Pick a date',
			initialValue: '2025-01-15',
			input,
			output,
		});

		input.emit('keypress', undefined, { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders initial value', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			initialValue: '2025-01-15',
			input,
			output,
		});

		input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBe('2025-01-15');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can cancel', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			initialValue: '2025-06-15',
			input,
			output,
		});

		input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBe('2025-06-15');
		expect(output.buffer).toMatchSnapshot();
	});

	test('defaultValue used when empty submit', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			defaultValue: '2025-12-25',
			input,
			output,
		});

		input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBe('2025-12-25');
		expect(output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			withGuide: false,
			initialValue: '2025-01-15',
			input,
			output,
		});

		input.emit('keypress', undefined, { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('supports MM/DD/YYYY format', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			format: 'MM/DD/YYYY',
			initialValue: '2025-01-15',
			input,
			output,
		});

		input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBe('2025-01-15');
		expect(output.buffer).toMatchSnapshot();
	});
});
