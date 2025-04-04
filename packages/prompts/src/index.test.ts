import { Readable, Writable } from 'node:stream';
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

			await result;

			expect(output.buffer).toMatchSnapshot();
			// TODO (43081j): uncomment this when #263 is fixed
			// expect(value).toBe('bar');
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
});
