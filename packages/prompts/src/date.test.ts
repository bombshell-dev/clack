import { updateSettings } from '@clack/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

const d = (iso: string) => {
	const [y, m, day] = iso.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, day));
};

describe.each(['true', 'false'])('date (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	afterEach(() => {
		updateSettings({ withGuide: true });
	});

	test('renders message', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			initialValue: d('2025-01-15'),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', undefined, { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders initial value', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			initialValue: d('2025-01-15'),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBeInstanceOf(Date);
		expect((value as Date).toISOString().slice(0, 10)).toBe('2025-01-15');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can cancel', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			initialValue: d('2025-06-15'),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBeInstanceOf(Date);
		expect((value as Date).toISOString().slice(0, 10)).toBe('2025-06-15');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('defaultValue used when empty submit', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			defaultValue: d('2025-12-25'),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBeInstanceOf(Date);
		expect((value as Date).toISOString().slice(0, 10)).toBe('2025-12-25');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			withGuide: false,
			initialValue: d('2025-01-15'),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', undefined, { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('supports MM/DD/YYYY format', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			format: 'MM/DD/YYYY',
			initialValue: d('2025-01-15'),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', undefined, { name: 'return' });

		const value = await result;

		expect(value).toBeInstanceOf(Date);
		expect((value as Date).toISOString().slice(0, 10)).toBe('2025-01-15');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('minDate shows error when date before min and submit', async () => {
		const result = prompts.date({
			message: 'Pick a date',
			initialValue: d('2025-01-10'),
			minDate: d('2025-01-15'),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', undefined, { name: 'return' });
		await new Promise((r) => setImmediate(r));

		const hasError = mocks.output.buffer.some(
			(s) => typeof s === 'string' && s.includes('Date must be on or after')
		);
		expect(hasError).toBe(true);

		mocks.input.emit('keypress', 'escape', { name: 'escape' });
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
	});
});
