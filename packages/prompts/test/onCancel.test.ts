import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

const cancelKey = { name: 'escape' } as const;
const submitKey = { name: 'return' } as const;

describe('onCancel', () => {
	let originalCI: string | undefined;
	let output: MockWritable;
	let input: MockReadable;

	beforeAll(() => {
		originalCI = process.env.CI;
		process.env.CI = 'true';
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

	describe('confirm', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.confirm({ message: 'q', onCancel, input, output });
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.confirm({ message: 'q', onCancel, input, output });
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(value).toBe(true);
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('text', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.text({ message: 'q', onCancel, input, output });
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.text({ message: 'q', onCancel, input, output });
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(typeof value).toBe('string');
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('select', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.select({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.select({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(value).toBe('a');
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('multiselect', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.multiselect({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.multiselect({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				required: false,
				onCancel,
				input,
				output,
			});
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(Array.isArray(value)).toBe(true);
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('groupMultiselect', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.groupMultiselect({
				message: 'q',
				options: { group: [{ value: 'a' }] },
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.groupMultiselect({
				message: 'q',
				options: { group: [{ value: 'a' }] },
				required: false,
				onCancel,
				input,
				output,
			});
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(Array.isArray(value)).toBe(true);
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('password', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.password({ message: 'q', onCancel, input, output });
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.password({ message: 'q', onCancel, input, output });
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(value).toBe('x');
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('selectKey', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.selectKey({
				message: 'q',
				options: [{ value: 'a' as const }, { value: 'b' as const }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.selectKey({
				message: 'q',
				options: [{ value: 'a' as const }, { value: 'b' as const }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'a', { name: 'a' });
			const value = await result;
			expect(value).toBe('a');
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('date', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.date({
				message: 'q',
				locale: 'en-US',
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const d = new Date(Date.UTC(2025, 0, 15));
			const result = prompts.date({
				message: 'q',
				locale: 'en-US',
				initialValue: d,
				onCancel,
				input,
				output,
			});
			input.emit('keypress', undefined, submitKey);
			const value = await result;
			expect(value).toBeInstanceOf(Date);
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('multiline', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.multiline({ message: 'q', onCancel, input, output });
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.multiline({ message: 'q', onCancel, input, output });
			input.emit('keypress', '', submitKey);
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(typeof value).toBe('string');
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('path', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.path({
				message: 'q',
				root: '/tmp/',
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.path({
				message: 'q',
				root: '/tmp/',
				onCancel,
				input,
				output,
			});
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(typeof value).toBe('string');
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('autocomplete', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.autocomplete({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.autocomplete({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(value).toBe('a');
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('autocompleteMultiselect', () => {
		test('calls onCancel when cancelled', async () => {
			const onCancel = vi.fn();
			const result = prompts.autocompleteMultiselect({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				onCancel,
				input,
				output,
			});
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});

		test('does not call onCancel on submit', async () => {
			const onCancel = vi.fn();
			const result = prompts.autocompleteMultiselect({
				message: 'q',
				options: [{ value: 'a' }, { value: 'b' }],
				required: false,
				onCancel,
				input,
				output,
			});
			input.emit('keypress', '', submitKey);
			const value = await result;
			expect(Array.isArray(value)).toBe(true);
			expect(onCancel).not.toHaveBeenCalled();
		});
	});

	describe('handleCancel utility', () => {
		test('resolves with cancel symbol when no onCancel provided', async () => {
			const result = prompts.text({ message: 'q', input, output });
			input.emit('keypress', 'escape', cancelKey);
			const value = await result;
			expect(prompts.isCancel(value)).toBe(true);
		});
	});
});
