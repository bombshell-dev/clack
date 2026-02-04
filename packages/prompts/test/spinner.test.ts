import { EventEmitter } from 'node:stream';
import { getColumns, updateSettings } from '@clack/core';
import color from 'picocolors';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('spinner (isCI = %s)', (isCI) => {
	let originalCI: string | undefined;
	let output: MockWritable;

	beforeAll(() => {
		originalCI = process.env.CI;
		process.env.CI = isCI;
	});

	afterAll(() => {
		process.env.CI = originalCI;
	});

	beforeEach(() => {
		output = new MockWritable();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		updateSettings({ withGuide: true });
	});

	test('returns spinner API', () => {
		const api = prompts.spinner({ output });

		expect(api.stop).toBeTypeOf('function');
		expect(api.start).toBeTypeOf('function');
		expect(api.message).toBeTypeOf('function');
	});

	describe('start', () => {
		test('renders frames at interval', () => {
			const result = prompts.spinner({ output });

			result.start();

			// there are 4 frames
			for (let i = 0; i < 4; i++) {
				vi.advanceTimersByTime(80);
			}

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message', () => {
			const result = prompts.spinner({ output });

			result.start('foo');

			vi.advanceTimersByTime(80);

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders timer when indicator is "timer"', () => {
			const result = prompts.spinner({ output, indicator: 'timer' });

			result.start();

			vi.advanceTimersByTime(80);

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});

		test('handles wrapping', () => {
			const columns = getColumns(output);
			const result = prompts.spinner({ output });

			result.start('x'.repeat(columns + 10));

			vi.advanceTimersByTime(80);

			result.stop('stopped');

			expect(output.buffer).toMatchSnapshot();
		});

		test('handles multi-line messages', () => {
			const result = prompts.spinner({ output });

			result.start('foo\nbar\nbaz');

			vi.advanceTimersByTime(80);

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('stop', () => {
		test('renders submit symbol and stops spinner', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.stop();

			vi.advanceTimersByTime(80);

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders cancel symbol when calling cancel()', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.cancel();

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders error symbol when calling error()', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.error();

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.stop('foo');

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message without removing dots', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.stop('foo.');

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message when cancelling', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.cancel('too dizzy — spinning cancelled');

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message when erroring', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.error('error: spun too fast!');

			expect(output.buffer).toMatchSnapshot();
		});

		test('does not throw if called before start', () => {
			const result = prompts.spinner({ output });

			expect(() => result.stop()).not.toThrow();
		});
	});

	describe('message', () => {
		test('sets message for next frame', () => {
			const result = prompts.spinner({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.message('foo');

			vi.advanceTimersByTime(80);

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('indicator customization', () => {
		test('custom frames', () => {
			const result = prompts.spinner({ output, frames: ['🐴', '🦋', '🐙', '🐶'] });

			result.start();

			// there are 4 frames
			for (let i = 0; i < 4; i++) {
				vi.advanceTimersByTime(80);
			}

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});

		test('custom frames with lots of frame have consistent ellipsis display', () => {
			const result = prompts.spinner({ output, frames: Object.keys(Array(10).fill(0)) });

			result.start();

			for (let i = 0; i < 64; i++) {
				vi.advanceTimersByTime(80);
			}

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});

		test('custom delay', () => {
			const result = prompts.spinner({ output, delay: 200 });

			result.start();

			// there are 4 frames
			for (let i = 0; i < 4; i++) {
				vi.advanceTimersByTime(200);
			}

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});

		test('custom frame style', () => {
			const result = prompts.spinner({ output, styleFrame: color.red });

			result.start();

			for (let i = 0; i < 4; i++) {
				vi.advanceTimersByTime(80);
			}

			result.stop();

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('process exit handling', () => {
		let processEmitter: EventEmitter;

		beforeEach(() => {
			processEmitter = new EventEmitter();

			// Spy on process methods
			vi.spyOn(process, 'on').mockImplementation((ev, listener) => {
				processEmitter.on(ev, listener);
				return process;
			});
			vi.spyOn(process, 'removeListener').mockImplementation((ev, listener) => {
				processEmitter.removeListener(ev, listener);
				return process;
			});
		});

		afterEach(() => {
			processEmitter.removeAllListeners();
		});

		test('uses default cancel message', () => {
			const result = prompts.spinner({ output });
			result.start('Test operation');

			processEmitter.emit('SIGINT');

			expect(output.buffer).toMatchSnapshot();
		});

		test('uses custom cancel message when provided directly', () => {
			const result = prompts.spinner({
				output,
				cancelMessage: 'Custom cancel message',
			});
			result.start('Test operation');

			processEmitter.emit('SIGINT');

			expect(output.buffer).toMatchSnapshot();
		});

		test('uses custom error message when provided directly', () => {
			const result = prompts.spinner({
				output,
				errorMessage: 'Custom error message',
			});
			result.start('Test operation');

			processEmitter.emit('exit', 2);

			expect(output.buffer).toMatchSnapshot();
		});

		test('uses global custom cancel message from settings', () => {
			// Store original message
			const originalCancelMessage = prompts.settings.messages.cancel;
			try {
				// Set custom message
				prompts.settings.messages.cancel = 'Global cancel message';

				const result = prompts.spinner({ output });
				result.start('Test operation');

				processEmitter.emit('SIGINT');

				expect(output.buffer).toMatchSnapshot();
			} finally {
				// Reset to original
				prompts.settings.messages.cancel = originalCancelMessage;
			}
		});

		test('uses global custom error message from settings', () => {
			// Store original message
			const originalErrorMessage = prompts.settings.messages.error;

			try {
				// Set custom message
				prompts.settings.messages.error = 'Global error message';

				const result = prompts.spinner({ output });
				result.start('Test operation');

				processEmitter.emit('exit', 2);

				expect(output.buffer).toMatchSnapshot();
			} finally {
				// Reset to original
				prompts.settings.messages.error = originalErrorMessage;
			}
		});

		test('prioritizes error option over global setting', () => {
			// Store original messages
			const originalErrorMessage = prompts.settings.messages.error;

			try {
				// Set custom global messages
				prompts.settings.messages.error = 'Global error message';

				const result = prompts.spinner({
					output,
					errorMessage: 'Spinner error message',
				});
				result.start('Test operation');

				processEmitter.emit('exit', 2);
				expect(output.buffer).toMatchSnapshot();
			} finally {
				// Reset to original values
				prompts.settings.messages.error = originalErrorMessage;
			}
		});

		test('prioritizes cancel option over global setting', () => {
			// Store original messages
			const originalCancelMessage = prompts.settings.messages.cancel;

			try {
				// Set custom global messages
				prompts.settings.messages.cancel = 'Global cancel message';

				const result = prompts.spinner({
					output,
					cancelMessage: 'Spinner cancel message',
				});
				result.start('Test operation');

				processEmitter.emit('SIGINT');
				expect(output.buffer).toMatchSnapshot();
			} finally {
				// Reset to original values
				prompts.settings.messages.cancel = originalCancelMessage;
			}
		});
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.spinner({
			output,
			signal: controller.signal,
		});

		result.start('Testing');

		controller.abort();

		expect(output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', () => {
		const result = prompts.spinner({ output, withGuide: false });

		result.start('foo');

		vi.advanceTimersByTime(80);

		result.stop();

		expect(output.buffer).toMatchSnapshot();
	});

	test('global withGuide: false removes guide', () => {
		updateSettings({ withGuide: false });

		const result = prompts.spinner({ output });

		result.start('foo');

		vi.advanceTimersByTime(80);

		result.stop();

		expect(output.buffer).toMatchSnapshot();
	});

	describe('clear', () => {
		test('stops and clears the spinner from the output', () => {
			const result = prompts.spinner({ output });

			result.start('Loading');

			vi.advanceTimersByTime(80);

			result.clear();

			expect(output.buffer).toMatchSnapshot();
		});
	});
});
