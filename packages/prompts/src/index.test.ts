import { Writable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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

describe('spinner', () => {
	let output: MockWritable;

	beforeEach(() => {
		vi.useFakeTimers();
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
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
