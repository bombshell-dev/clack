import { styleText } from 'node:util';
import { beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('note (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	test('renders message with title', () => {
		prompts.note('message', 'title', {
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders as wide as longest line', () => {
		prompts.note('short\nsomewhat questionably long line', 'title', {
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('formatter which adds length works', () => {
		prompts.note('line 0\nline 1\nline 2', 'title', {
			format: (line) => `* ${line} *`,
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('formatter which adds colors works', () => {
		prompts.note('line 0\nline 1\nline 2', 'title', {
			format: (line) => styleText('red', line),
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test("don't overflow", () => {
		const message = `${'test string '.repeat(32)}\n`.repeat(4).trim();
		mocks.output.columns = 75;
		prompts.note(message, 'title', {
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test("don't overflow with formatter", () => {
		const message = `${'test string '.repeat(32)}\n`.repeat(4).trim();
		mocks.output.columns = 75;
		prompts.note(message, 'title', {
			format: (line) => styleText('red', `* ${styleText('cyan', line)} *`),
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('handle wide characters', () => {
		const messages = ['이게 첫 번째 줄이에요', 'これは次の行です'];
		mocks.output.columns = 10;
		prompts.note(messages.join('\n'), '这是标题', {
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('handle wide characters with formatter', () => {
		const messages = ['이게 첫 번째 줄이에요', 'これは次の行です'];
		mocks.output.columns = 10;
		prompts.note(messages.join('\n'), '这是标题', {
			format: (line) => styleText('red', `* ${styleText('cyan', line)} *`),
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('without guide', () => {
		prompts.note('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			withGuide: false,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
