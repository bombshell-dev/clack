import { BACK_SYMBOL, CANCEL_SYMBOL, isBack, settings } from '@clack/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

const SHIFT_TAB = '\x1b[Z';

describe('group', () => {
	afterEach(() => {
		settings.aliases.delete(SHIFT_TAB);
		vi.restoreAllMocks();
	});

	test('collects each prompt result into one object', async () => {
		const result = await prompts.group({
			a: () => Promise.resolve('a1'),
			b: () => Promise.resolve('b1'),
		});
		expect(result).toEqual({ a: 'a1', b: 'b1' });
	});

	test('a step returning BACK_SYMBOL returns to the previous step', async () => {
		const visits: string[] = [];
		let bWentBack = false;
		const result = await prompts.group({
			a: () => {
				visits.push('a');
				return Promise.resolve('a1');
			},
			b: () => {
				visits.push('b');
				if (!bWentBack) {
					bWentBack = true;
					return Promise.resolve(BACK_SYMBOL);
				}
				return Promise.resolve('b1');
			},
		});
		expect(visits).toEqual(['a', 'b', 'a', 'b']);
		expect(result).toEqual({ a: 'a1', b: 'b1' });
	});

	test('offers the previous answer back to a revisited step', async () => {
		const seenPrev: unknown[] = [];
		let bWentBack = false;
		await prompts.group({
			a: ({ previous }) => {
				seenPrev.push(previous);
				return Promise.resolve('a-val');
			},
			b: () => {
				if (!bWentBack) {
					bWentBack = true;
					return Promise.resolve(BACK_SYMBOL);
				}
				return Promise.resolve('b-val');
			},
		});
		// `a` runs twice: first with no previous, then (after going back) with its kept answer.
		expect(seenPrev).toEqual([undefined, 'a-val']);
	});

	test('preserves a submitted answer when returning to its step from further ahead', async () => {
		const bPrev: unknown[] = [];
		let cWentBack = false;
		const result = await prompts.group({
			a: () => Promise.resolve('a'),
			b: ({ previous }) => {
				bPrev.push(previous);
				return Promise.resolve('b-val');
			},
			c: () => {
				if (!cWentBack) {
					cWentBack = true;
					return Promise.resolve(BACK_SYMBOL);
				}
				return Promise.resolve('c');
			},
		});
		// c goes back to b; b is re-offered its earlier answer.
		expect(bPrev).toEqual([undefined, 'b-val']);
		expect(result).toEqual({ a: 'a', b: 'b-val', c: 'c' });
	});

	test('calls onBack with the step being left and the step returned to', async () => {
		const onBack = vi.fn();
		let bWentBack = false;
		await prompts.group(
			{
				a: () => Promise.resolve('a1'),
				b: () => {
					if (!bWentBack) {
						bWentBack = true;
						return Promise.resolve(BACK_SYMBOL);
					}
					return Promise.resolve('b1');
				},
			},
			{ onBack }
		);
		expect(onBack).toHaveBeenCalledTimes(1);
		expect(onBack.mock.calls[0]?.[0]).toMatchObject({ from: 'b', to: 'a' });
	});

	test('disables back on the first step and enables it afterwards', async () => {
		const aliasDuring: boolean[] = [];
		let bWentBack = false;
		await prompts.group({
			a: () => {
				aliasDuring.push(settings.aliases.has(SHIFT_TAB));
				return Promise.resolve('a');
			},
			b: () => {
				aliasDuring.push(settings.aliases.has(SHIFT_TAB));
				if (!bWentBack) {
					bWentBack = true;
					return Promise.resolve(BACK_SYMBOL);
				}
				return Promise.resolve('b');
			},
		});
		// a (root) -> off, b -> on, back to a -> off, b -> on.
		expect(aliasDuring).toEqual([false, true, false, true]);
	});

	test('a forced BACK on the first step is ignored (re-runs, never goes out of range)', async () => {
		let count = 0;
		const result = await prompts.group({
			a: () => {
				count++;
				return Promise.resolve(count === 1 ? BACK_SYMBOL : 'a-final');
			},
		});
		expect(count).toBe(2);
		expect(result).toEqual({ a: 'a-final' });
	});

	test('navigate:false disables back and never binds Shift+Tab', async () => {
		const result = await prompts.group(
			{ a: () => Promise.resolve(BACK_SYMBOL) },
			{ navigate: false }
		);
		expect(isBack(result.a)).toBe(true);
		expect(settings.aliases.has(SHIFT_TAB)).toBe(false);
	});

	test('restores the Shift+Tab alias state after running', async () => {
		expect(settings.aliases.has(SHIFT_TAB)).toBe(false);
		await prompts.group({ a: () => Promise.resolve('a1') });
		expect(settings.aliases.has(SHIFT_TAB)).toBe(false);
	});

	test('onCancel still fires and collects results', async () => {
		const onCancel = vi.fn();
		const result = await prompts.group(
			{
				a: () => Promise.resolve('a1'),
				b: () => Promise.resolve(CANCEL_SYMBOL),
			},
			{ onCancel }
		);
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(result).toMatchObject({ a: 'a1', b: 'canceled' });
	});
});

describe('back navigation (core wiring)', () => {
	afterEach(() => {
		settings.aliases.delete(SHIFT_TAB);
	});

	test('Shift+Tab resolves a text prompt to BACK_SYMBOL when the back action is bound', async () => {
		settings.aliases.set(SHIFT_TAB, 'back');
		const input = new MockReadable();
		const output = new MockWritable();
		const result = prompts.text({ message: 'foo', input, output });
		input.emit('keypress', '', { name: 'tab', shift: true, sequence: SHIFT_TAB });
		const value = await result;
		expect(isBack(value)).toBe(true);
	});

	test('going back leaves no "undefined" in the rendered output', async () => {
		settings.aliases.set(SHIFT_TAB, 'back');
		const input = new MockReadable();
		const output = new MockWritable();
		const result = prompts.select({
			message: 'pick one',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});
		input.emit('keypress', '', { name: 'tab', shift: true, sequence: SHIFT_TAB });
		await result;
		expect(output.buffer.join('')).not.toContain('undefined');
	});

	test('Shift+Tab resolves a select prompt to BACK_SYMBOL', async () => {
		settings.aliases.set(SHIFT_TAB, 'back');
		const input = new MockReadable();
		const output = new MockWritable();
		const result = prompts.select({
			message: 'pick one',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});
		input.emit('keypress', '', { name: 'tab', shift: true, sequence: SHIFT_TAB });
		const value = await result;
		expect(isBack(value)).toBe(true);
	});

	test('a select prompt without the back action is unaffected by Shift+Tab', async () => {
		const input = new MockReadable();
		const output = new MockWritable();
		const result = prompts.select({
			message: 'pick one',
			options: [{ value: 'opt0' }, { value: 'opt1' }],
			input,
			output,
		});
		// No `back` alias bound: Shift+Tab does nothing, Enter still submits.
		input.emit('keypress', '', { name: 'tab', shift: true, sequence: SHIFT_TAB });
		input.emit('keypress', '', { name: 'return' });
		const value = await result;
		expect(value).toBe('opt0');
	});
});
