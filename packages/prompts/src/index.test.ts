import { EventEmitter, Readable, Writable } from 'node:stream';
import colors from 'picocolors';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from './index.js';

// TODO (43081j): move this into a util?
class MockWritable extends Writable {
	public buffer: string[] = [];

	_write(
		chunk: any,
		_encoding: BufferEncoding,
		callback: (error?: Error | null | undefined) => void
	): void {
		this.buffer.push(chunk.toString());
		callback();
	}
}

class MockReadable extends Readable {
	protected _buffer: unknown[] | null = [];

	_read() {
		if (this._buffer === null) {
			this.push(null);
			return;
		}

		for (const val of this._buffer) {
			this.push(val);
		}

		this._buffer = [];
	}

	pushValue(val: unknown): void {
		this._buffer?.push(val);
	}

	close(): void {
		this._buffer = null;
	}
}

describe.each(['true', 'false'])('prompts (isCI = %s)', (isCI) => {
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
	});

	describe('spinner', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
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

				expect(output.buffer).toMatchSnapshot();
			});

			test('renders message', () => {
				const result = prompts.spinner({ output });

				result.start('foo');

				vi.advanceTimersByTime(80);

				expect(output.buffer).toMatchSnapshot();
			});

			test('renders timer when indicator is "timer"', () => {
				const result = prompts.spinner({ output, indicator: 'timer' });

				result.start();

				vi.advanceTimersByTime(80);

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

			test('renders cancel symbol if code = 1', () => {
				const result = prompts.spinner({ output });

				result.start();

				vi.advanceTimersByTime(80);

				result.stop('', 1);

				expect(output.buffer).toMatchSnapshot();
			});

			test('renders error symbol if code > 1', () => {
				const result = prompts.spinner({ output });

				result.start();

				vi.advanceTimersByTime(80);

				result.stop('', 2);

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
		});

		describe('message', () => {
			test('sets message for next frame', () => {
				const result = prompts.spinner({ output });

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
				// Set custom message
				prompts.settings.messages.cancel = 'Global cancel message';

				const result = prompts.spinner({ output });
				result.start('Test operation');

				processEmitter.emit('SIGINT');

				expect(output.buffer).toMatchSnapshot();

				// Reset to original
				prompts.settings.messages.cancel = originalCancelMessage;
			});

			test('uses global custom error message from settings', () => {
				// Store original message
				const originalErrorMessage = prompts.settings.messages.error;
				// Set custom message
				prompts.settings.messages.error = 'Global error message';

				const result = prompts.spinner({ output });
				result.start('Test operation');

				processEmitter.emit('exit', 2);

				expect(output.buffer).toMatchSnapshot();

				// Reset to original
				prompts.settings.messages.error = originalErrorMessage;
			});

			test('prioritizes direct options over global settings', () => {
				// Store original messages
				const originalCancelMessage = prompts.settings.messages.cancel;
				const originalErrorMessage = prompts.settings.messages.error;

				// Set custom global messages
				prompts.settings.messages.cancel = 'Global cancel message';
				prompts.settings.messages.error = 'Global error message';

				const result = prompts.spinner({
					output,
					cancelMessage: 'Spinner cancel message',
					errorMessage: 'Spinner error message',
				});
				result.start('Test operation');

				processEmitter.emit('SIGINT');
				expect(output.buffer).toMatchSnapshot();

				// Reset buffer
				output.buffer = [];

				const result2 = prompts.spinner({
					output,
					cancelMessage: 'Spinner cancel message',
					errorMessage: 'Spinner error message',
				});
				result2.start('Test operation');

				processEmitter.emit('exit', 2);
				expect(output.buffer).toMatchSnapshot();

				// Reset to original values
				prompts.settings.messages.cancel = originalCancelMessage;
				prompts.settings.messages.error = originalErrorMessage;
			});
		});
	});

	describe('text', () => {
		test('renders message', async () => {
			const result = prompts.text({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			await result;

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders placeholder if set', async () => {
			const result = prompts.text({
				message: 'foo',
				placeholder: 'bar',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(output.buffer).toMatchSnapshot();

			expect(value).toBe('bar');
		});

		test('<tab> applies placeholder', async () => {
			const result = prompts.text({
				message: 'foo',
				placeholder: 'bar',
				input,
				output,
			});

			input.emit('keypress', '\t', { name: 'tab' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('bar');
		});

		test('can cancel', async () => {
			const result = prompts.text({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'escape', { name: 'escape' });

			const value = await result;

			expect(prompts.isCancel(value)).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders cancelled value if one set', async () => {
			const result = prompts.text({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'escape' });

			const value = await result;

			expect(prompts.isCancel(value)).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders submitted value', async () => {
			const result = prompts.text({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('xy');
			expect(output.buffer).toMatchSnapshot();
		});

		test('defaultValue sets the value but does not render', async () => {
			const result = prompts.text({
				message: 'foo',
				defaultValue: 'bar',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('bar');
			expect(output.buffer).toMatchSnapshot();
		});

		test('validation errors render and clear', async () => {
			const result = prompts.text({
				message: 'foo',
				validate: (val) => (val !== 'xy' ? 'should be xy' : undefined),
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('xy');
			expect(output.buffer).toMatchSnapshot();
		});

		test('validation errors render and clear (using Error)', async () => {
			const result = prompts.text({
				message: 'foo',
				validate: (val) => (val !== 'xy' ? new Error('should be xy') : undefined),
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('xy');
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('confirm', () => {
		test('renders message with choices', async () => {
			const result = prompts.confirm({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders custom active choice', async () => {
			const result = prompts.confirm({
				message: 'foo',
				active: 'bleep',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders custom inactive choice', async () => {
			const result = prompts.confirm({
				message: 'foo',
				inactive: 'bleep',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('right arrow moves to next choice', async () => {
			const result = prompts.confirm({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'right', { name: 'right' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe(false);
			expect(output.buffer).toMatchSnapshot();
		});

		test('left arrow moves to previous choice', async () => {
			const result = prompts.confirm({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'right', { name: 'right' });
			input.emit('keypress', 'left', { name: 'left' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can cancel', async () => {
			const result = prompts.confirm({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'escape', { name: 'escape' });

			const value = await result;

			expect(prompts.isCancel(value)).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set initialValue', async () => {
			const result = prompts.confirm({
				message: 'foo',
				initialValue: false,
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe(false);
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('select', () => {
		test('renders options and message', async () => {
			const result = prompts.select({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('opt0');
			expect(output.buffer).toMatchSnapshot();
		});

		test('down arrow selects next option', async () => {
			const result = prompts.select({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('opt1');
			expect(output.buffer).toMatchSnapshot();
		});

		test('up arrow selects previous option', async () => {
			const result = prompts.select({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'up' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('opt0');
			expect(output.buffer).toMatchSnapshot();
		});

		test('can cancel', async () => {
			const result = prompts.select({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				input,
				output,
			});

			input.emit('keypress', 'escape', { name: 'escape' });

			const value = await result;

			expect(prompts.isCancel(value)).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders option labels', async () => {
			const result = prompts.select({
				message: 'foo',
				options: [
					{ value: 'opt0', label: 'Option 0' },
					{ value: 'opt1', label: 'Option 1' },
				],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('opt0');
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders option hints', async () => {
			const result = prompts.select({
				message: 'foo',
				options: [
					{ value: 'opt0', hint: 'Hint 0' },
					{ value: 'opt1', hint: 'Hint 1' },
				],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('opt0');
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('multiselect', () => {
		test('renders message', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt0']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders multiple selected options', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }, { value: 'opt2' }],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt0', 'opt1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can cancel', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				input,
				output,
			});

			input.emit('keypress', 'escape', { name: 'escape' });

			const value = await result;

			expect(prompts.isCancel(value)).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders validation errors', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				input,
				output,
			});

			// try submit with nothing selected
			input.emit('keypress', '', { name: 'return' });
			// select and submit
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt0']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can submit without selection when required = false', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				required: false,
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual([]);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set cursorAt to preselect an option', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				cursorAt: 'opt1',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set initial values', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }],
				initialValues: ['opt1'],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('maxItems renders a sliding window', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [...Array(12).keys()].map((k) => ({
					value: `opt${k}`,
				})),
				maxItems: 6,
				input,
				output,
			});

			for (let i = 0; i < 6; i++) {
				input.emit('keypress', '', { name: 'down' });
			}
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt6']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('sliding window loops upwards', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [...Array(12).keys()].map((k) => ({
					value: `opt${k}`,
				})),
				maxItems: 6,
				input,
				output,
			});

			input.emit('keypress', '', { name: 'up' });
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt11']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('sliding window loops downwards', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [...Array(12).keys()].map((k) => ({
					value: `opt${k}`,
				})),
				maxItems: 6,
				input,
				output,
			});

			for (let i = 0; i < 12; i++) {
				input.emit('keypress', '', { name: 'down' });
			}
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt0']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set custom labels', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [
					{ value: 'opt0', label: 'Option 0' },
					{ value: 'opt1', label: 'Option 1' },
				],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt0']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can render option hints', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [
					{ value: 'opt0', hint: 'Hint 0' },
					{ value: 'opt1', hint: 'Hint 1' },
				],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt0']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('shows hints for all selected options', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [
					{ value: 'opt0', hint: 'Hint 0' },
					{ value: 'opt1', hint: 'Hint 1' },
					{ value: 'opt2', hint: 'Hint 2' },
				],
				initialValues: ['opt0', 'opt1'],
				input,
				output,
			});

			// Check that both selected options show their hints
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['opt0', 'opt1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders multiple cancelled values', async () => {
			const result = prompts.multiselect({
				message: 'foo',
				options: [{ value: 'opt0' }, { value: 'opt1' }, { value: 'opt2' }],
				input,
				output,
			});

			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'escape' });

			const value = await result;

			expect(prompts.isCancel(value)).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('password', () => {
		test('renders message', async () => {
			const result = prompts.password({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', '', { name: 'return' });

			await result;

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders masked value', async () => {
			const result = prompts.password({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toBe('xy');
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders custom mask', async () => {
			const result = prompts.password({
				message: 'foo',
				mask: '*',
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'return' });

			await result;

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders and clears validation errors', async () => {
			const result = prompts.password({
				message: 'foo',
				validate: (value) => {
					if (value.length < 2) {
						return 'Password must be at least 2 characters';
					}

					return undefined;
				},
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'return' });

			await result;

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders cancelled value', async () => {
			const result = prompts.password({
				message: 'foo',
				input,
				output,
			});

			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'escape' });

			const value = await result;

			expect(prompts.isCancel(value)).toBe(true);
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('groupMultiselect', () => {
		test('renders message with options', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
					group2: [{ value: 'group2value0' }],
				},
			});

			// Select the first non-group option
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });

			// submit
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can select multiple options', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }, { value: 'group1value2' }],
				},
			});

			// Select the first non-group option
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			// Select the second non-group option
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });

			// submit
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0', 'group1value1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can select a group', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
			});

			// Select the group as a whole
			input.emit('keypress', '', { name: 'space' });

			// submit
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0', 'group1value1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can select a group by selecting all members', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
			});

			// Select the first group option
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			// Select the second group option
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });

			// submit
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0', 'group1value1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can deselect an option', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
			});

			// Select the first group option
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			// Select the second group option
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			// Deselect it
			input.emit('keypress', '', { name: 'space' });

			// submit
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders error when nothing selected', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
			});

			// try submit
			input.emit('keypress', '', { name: 'return' });
			// now select something and submit
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0']);
			expect(output.buffer).toMatchSnapshot();
		});

		describe('selectableGroups = false', () => {
			test('cannot select groups', async () => {
				const result = prompts.groupMultiselect({
					message: 'foo',
					input,
					output,
					options: {
						group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
					},
					selectableGroups: false,
				});

				// first selectable item should be group's child
				input.emit('keypress', '', { name: 'space' });
				input.emit('keypress', '', { name: 'return' });

				const value = await result;

				expect(value).toEqual(['group1value0']);
				expect(output.buffer).toMatchSnapshot();
			});

			test('selecting all members of group does not select group', async () => {
				const result = prompts.groupMultiselect({
					message: 'foo',
					input,
					output,
					options: {
						group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
					},
					selectableGroups: false,
				});

				// first selectable item should be group's child
				input.emit('keypress', '', { name: 'space' });
				// select second item
				input.emit('keypress', '', { name: 'down' });
				input.emit('keypress', '', { name: 'space' });
				// submit
				input.emit('keypress', '', { name: 'return' });

				const value = await result;

				expect(value).toEqual(['group1value0', 'group1value1']);
				expect(output.buffer).toMatchSnapshot();
			});
		});

		test('can submit empty selection when require = false', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
				required: false,
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual([]);
			expect(output.buffer).toMatchSnapshot();
		});

		test('cursorAt sets initial selection', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
				cursorAt: 'group1value1',
			});

			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('initial values can be set', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
				initialValues: ['group1value1'],
			});

			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value1']);
			expect(output.buffer).toMatchSnapshot();
		});

		test('values can be non-primitive', async () => {
			const value0 = Symbol();
			const value1 = Symbol();
			const result = prompts.groupMultiselect({
				message: 'foo',
				input,
				output,
				options: {
					group1: [
						{ value: value0, label: 'value0' },
						{ value: value1, label: 'value1' },
					],
				},
			});

			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', '', { name: 'space' });
			input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual([value0]);
			expect(output.buffer).toMatchSnapshot();
		});

		describe('groupSpacing', () => {
			test('renders spaced groups', async () => {
				const result = prompts.groupMultiselect({
					message: 'foo',
					input,
					output,
					options: {
						group1: [{ value: 'group1value0' }],
						group2: [{ value: 'group2value0' }],
					},
					groupSpacing: 2,
				});

				input.emit('keypress', '', { name: 'down' });
				input.emit('keypress', '', { name: 'space' });
				input.emit('keypress', '', { name: 'return' });

				await result;

				expect(output.buffer).toMatchSnapshot();
			});

			test('negative spacing is ignored', async () => {
				const result = prompts.groupMultiselect({
					message: 'foo',
					input,
					output,
					options: {
						group1: [{ value: 'group1value0' }],
						group2: [{ value: 'group2value0' }],
					},
					groupSpacing: -2,
				});

				input.emit('keypress', '', { name: 'down' });
				input.emit('keypress', '', { name: 'space' });
				input.emit('keypress', '', { name: 'return' });

				await result;

				expect(output.buffer).toMatchSnapshot();
			});
		});
	});

	describe('note', () => {
		test('renders message with title', () => {
			prompts.note('message', 'title', {
				input,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders as wide as longest line', () => {
			prompts.note('short\nsomewhat questionably long line', 'title', {
				input,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('formatter which adds length works', () => {
			prompts.note('line 0\nline 1\nline 2', 'title', {
				format: (line) => `* ${line} *`,
				input,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('formatter which adds colors works', () => {
			prompts.note('line 0\nline 1\nline 2', 'title', {
				format: (line) => colors.red(line),
				input,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('taskLog', () => {
		test('writes message header', () => {
			prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			expect(output.buffer).toMatchSnapshot();
		});

		describe('message', () => {
			test('can write line by line', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0');
				log.message('line 1');

				expect(output.buffer).toMatchSnapshot();
			});

			test('can write multiple lines', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0\nline 1');

				expect(output.buffer).toMatchSnapshot();
			});

			test('enforces limit if set', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
					limit: 2,
				});

				log.message('line 0');
				log.message('line 1');
				log.message('line 2');

				expect(output.buffer).toMatchSnapshot();
			});

			test('raw = true appends message text until newline', async () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0', { raw: true });
				log.message('still line 0', { raw: true });
				log.message('\nline 1', { raw: true });

				expect(output.buffer).toMatchSnapshot();
			});

			test('raw = true works when mixed with non-raw messages', async () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0', { raw: true });
				log.message('still line 0', { raw: true });
				log.message('line 1');

				expect(output.buffer).toMatchSnapshot();
			});

			test('raw = true works when started with non-raw messages', async () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0');
				log.message('line 1', { raw: true });
				log.message('still line 1', { raw: true });

				expect(output.buffer).toMatchSnapshot();
			});

			test('prints empty lines', async () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('');
				log.message('line 1');
				log.message('');
				log.message('line 3');

				expect(output.buffer).toMatchSnapshot();
			});
		});

		describe('error', () => {
			test('renders output with message', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0');
				log.message('line 1');

				log.error('some error!');

				expect(output.buffer).toMatchSnapshot();
			});

			test('clears output if showLog = false', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0');
				log.message('line 1');

				log.error('some error!', { showLog: false });

				expect(output.buffer).toMatchSnapshot();
			});
		});

		describe('success', () => {
			test('clears output and renders message', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0');
				log.message('line 1');

				log.success('success!');

				expect(output.buffer).toMatchSnapshot();
			});

			test('renders output if showLog = true', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
				});

				log.message('line 0');
				log.message('line 1');

				log.success('success!', { showLog: true });

				expect(output.buffer).toMatchSnapshot();
			});
		});

		describe('retainLog', () => {
			describe.each(['error', 'success'] as const)('%s', (method) => {
				test('retainLog = true outputs full log', () => {
					const log = prompts.taskLog({
						input,
						output,
						title: 'foo',
						retainLog: true,
					});

					for (let i = 0; i < 4; i++) {
						log.message(`line ${i}`);
					}

					log[method]('woo!', { showLog: true });

					expect(output.buffer).toMatchSnapshot();
				});

				test('retainLog = true outputs full log with limit', () => {
					const log = prompts.taskLog({
						input,
						output,
						title: 'foo',
						retainLog: true,
						limit: 2,
					});

					for (let i = 0; i < 4; i++) {
						log.message(`line ${i}`);
					}

					log[method]('woo!', { showLog: true });

					expect(output.buffer).toMatchSnapshot();
				});

				test('retainLog = false outputs full log without limit', () => {
					const log = prompts.taskLog({
						input,
						output,
						title: 'foo',
						retainLog: false,
					});

					for (let i = 0; i < 4; i++) {
						log.message(`line ${i}`);
					}

					log[method]('woo!', { showLog: true });

					expect(output.buffer).toMatchSnapshot();
				});

				test('retainLog = false outputs limited log with limit', () => {
					const log = prompts.taskLog({
						input,
						output,
						title: 'foo',
						retainLog: false,
						limit: 2,
					});

					for (let i = 0; i < 4; i++) {
						log.message(`line ${i}`);
					}

					log[method]('woo!', { showLog: true });

					expect(output.buffer).toMatchSnapshot();
				});

				test('outputs limited log with limit by default', () => {
					const log = prompts.taskLog({
						input,
						output,
						title: 'foo',
						limit: 2,
					});

					for (let i = 0; i < 4; i++) {
						log.message(`line ${i}`);
					}

					log[method]('woo!', { showLog: true });

					expect(output.buffer).toMatchSnapshot();
				});
			});
		});
	});
});
