import { settings, updateSettings } from '@clack/core';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockWritable } from './test-utils.js';

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escape codes is the point
const ANSI_REGEX = /\x1b\[/;

describe('spinner (accessible)', () => {
	let originalAccessibleEnv: string | undefined;
	let originalCIEnv: string | undefined;
	let output: MockWritable;

	beforeEach(() => {
		originalAccessibleEnv = process.env.ACCESSIBLE;
		originalCIEnv = process.env.CI;
		delete process.env.ACCESSIBLE;
		output = new MockWritable();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		process.env.ACCESSIBLE = originalAccessibleEnv;
		process.env.CI = originalCIEnv;
		settings.accessible = undefined;
	});

	test('renders static append-only output with no decorations', () => {
		const result = prompts.spinner({ output, accessible: true, withGuide: true });

		result.start('Loading');
		result.message('Installing');
		result.message('Linking');
		vi.advanceTimersByTime(30_000);
		result.stop('Installed');
		vi.advanceTimersByTime(60_000);

		expect(output.buffer).toEqual(['Loading\n', 'still working: Linking\n', 'Installed\n']);
		expect(output.buffer.join('')).not.toMatch(ANSI_REGEX);
	});

	test('falls back to plain status words when stopped without a message', () => {
		for (const [end, line] of [
			['stop', 'Done\n'],
			['cancel', 'Canceled\n'],
			['error', 'Something went wrong\n'],
		] as const) {
			output = new MockWritable();
			const result = prompts.spinner({ output, accessible: true });
			result.start('Working');
			result[end]();
			expect(output.buffer).toEqual(['Working\n', line]);
		}
	});

	test('accessibleInterval configures the heartbeat and 0 disables it', () => {
		const result = prompts.spinner({ output, accessible: true, accessibleInterval: 5000 });
		result.start('a');
		vi.advanceTimersByTime(5000);
		result.clear();
		expect(output.buffer).toEqual(['a\n', 'still working: a\n']);

		output = new MockWritable();
		const silent = prompts.spinner({ output, accessible: true, accessibleInterval: 0 });
		silent.start('a');
		vi.advanceTimersByTime(120_000);
		silent.clear();
		expect(output.buffer).toEqual(['a\n']);
	});

	test('abort signal cancels with a plain line', () => {
		const controller = new AbortController();
		const onCancel = vi.fn();
		const result = prompts.spinner({
			output,
			accessible: true,
			signal: controller.signal,
			onCancel,
		});

		result.start('Working');
		controller.abort();

		expect(output.buffer).toEqual(['Working\n', 'Canceled\n']);
		expect(result.isCancelled).toBe(true);
		expect(onCancel).toHaveBeenCalledOnce();
	});

	test('accessible takes precedence over CI mode', () => {
		process.env.CI = 'true';
		const result = prompts.spinner({ output, accessible: true });

		result.start('Loading');
		vi.advanceTimersByTime(1000);
		result.stop('Done');

		expect(output.buffer).toEqual(['Loading\n', 'Done\n']);
	});

	test('enabled via ACCESSIBLE env var', () => {
		process.env.ACCESSIBLE = '1';
		const result = prompts.spinner({ output });

		result.start('Loading');
		result.stop('Done');

		expect(output.buffer).toEqual(['Loading\n', 'Done\n']);
	});

	test('accessible: false option overrides the global setting', () => {
		updateSettings({ accessible: true });
		const result = prompts.spinner({ output, accessible: false });

		result.start('Loading');
		result.stop('Done');

		expect(output.buffer.join('')).toMatch(ANSI_REGEX);
	});
});
