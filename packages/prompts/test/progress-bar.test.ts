import process from 'node:process';
import { EventEmitter } from 'node:stream';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ProgressOptions } from '../src/index.js';
import * as prompts from '../src/index.js';
import { MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('prompts - progress (isCI = %s)', (isCI) => {
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
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	test('returns progress API', () => {
		const api = prompts.progress({ output });

		expect(api.stop).toBeTypeOf('function');
		expect(api.start).toBeTypeOf('function');
		expect(api.message).toBeTypeOf('function');
		expect(api.advance).toBeTypeOf('function');
	});

	describe('start', () => {
		test('renders frames at interval', () => {
			const result = prompts.progress({ output });

			result.start();

			// there are 4 frames
			for (let i = 0; i < 4; i++) {
				vi.advanceTimersByTime(80);
			}

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message', () => {
			const result = prompts.progress({ output });

			result.start('foo');

			vi.advanceTimersByTime(80);

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders timer when indicator is "timer"', () => {
			const result = prompts.progress({ output, indicator: 'timer' });

			result.start();

			vi.advanceTimersByTime(80);

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('stop', () => {
		test('renders submit symbol and stops progress', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.stop();

			vi.advanceTimersByTime(80);

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders cancel symbol when calling cancel()', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.cancel();

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders error symbol when calling error()', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.error();

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.stop('foo');

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message without removing dots', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.stop('foo.');

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message when cancelling', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.cancel('cancelled :-(');

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message when erroring', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.error('FATAL ERROR!');

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('message', () => {
		test('sets message for next frame', () => {
			const result = prompts.progress({ output });

			result.start();

			vi.advanceTimersByTime(80);

			result.message('foo');

			vi.advanceTimersByTime(80);

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
			const result = prompts.progress({ output });
			result.start('Test operation');

			processEmitter.emit('SIGINT');

			expect(output.buffer).toMatchSnapshot();
		});

		test('uses custom cancel message when provided directly', () => {
			const result = prompts.progress({
				output,
				cancelMessage: 'Custom cancel message',
			});
			result.start('Test operation');

			processEmitter.emit('SIGINT');

			expect(output.buffer).toMatchSnapshot();
		});

		test('uses custom error message when provided directly', () => {
			const result = prompts.progress({
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

				const result = prompts.progress({ output });
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

				const result = prompts.progress({ output });
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

				const result = prompts.progress({
					output,
					errorMessage: 'Progress error message',
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

				const result = prompts.progress({
					output,
					cancelMessage: 'Progress cancel message',
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

	describe('style', () => {
		test.each(['block', 'heavy', 'light'] satisfies Array<ProgressOptions['style']>)(
			'renders %s progressbar',
			(style) => {
				const result = prompts.progress({ output, style, max: 2, size: 10 });
				result.start();
				vi.advanceTimersByTime(160);
				result.advance();
				vi.advanceTimersByTime(160);
				result.stop();

				expect(output.buffer).toMatchSnapshot();
			}
		);
	});
});
