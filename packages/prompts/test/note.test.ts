import colors from 'picocolors';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('note (isCI = %s)', (isCI) => {
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

	test("don't overflow", () => {
		const input = `${'test string '.repeat(32)}\n`.repeat(4).trim();
		prompts.note(input, 'title', {
			input,
			output: Object.assign(output, { columns: 75 }),
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test("don't overflow with formatter", () => {
		const input = `${'test string '.repeat(32)}\n`.repeat(4).trim();
		prompts.note(input, 'title', {
			format: (line) => colors.red(`* ${colors.cyan(line)} *`),
			input,
			output: Object.assign(output, { columns: 75 }),
		});

		expect(output.buffer).toMatchSnapshot();
	});
});
