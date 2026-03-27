import { styleText } from 'node:util';
import { updateSettings } from '@clack/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('box (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	afterEach(() => {
		updateSettings({ withGuide: true });
	});

	test('renders message', () => {
		prompts.box('message', undefined, {
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders message with title', () => {
		prompts.box('message', 'some title', {
			input: mocks.input,
			output: mocks.output,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders as wide as longest line with width: auto', () => {
		prompts.box('short\nsomewhat questionably long line', 'title', {
			input: mocks.input,
			output: mocks.output,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders as specified width', () => {
		prompts.box('short\nsomewhat questionably long line', 'title', {
			input: mocks.input,
			output: mocks.output,
			width: 0.5,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('wraps content to fit within specified width', () => {
		prompts.box('foo bar'.repeat(20), 'title', {
			input: mocks.input,
			output: mocks.output,
			width: 0.5,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders specified titlePadding', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			titlePadding: 6,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders specified contentPadding', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			contentPadding: 6,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders without guide when withGuide is false', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			withGuide: false,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders without guide when global withGuide is false', () => {
		updateSettings({ withGuide: false });

		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders truncated long titles', () => {
		prompts.box('message', 'foo'.repeat(20), {
			input: mocks.input,
			output: mocks.output,
			width: 0.2,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('cannot have width larger than 100%', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			width: 1.1,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders rounded corners when rounded is true', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			rounded: true,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders auto width with content longer than title', () => {
		prompts.box('message'.repeat(4), 'title', {
			input: mocks.input,
			output: mocks.output,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders auto width with title longer than content', () => {
		prompts.box('message', 'title'.repeat(4), {
			input: mocks.input,
			output: mocks.output,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders left aligned title', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			titleAlign: 'left',
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders right aligned title', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			titleAlign: 'right',
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders center aligned title', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			titleAlign: 'center',
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders left aligned content', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			contentAlign: 'left',
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders right aligned content', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			contentAlign: 'right',
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders center aligned content', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			contentAlign: 'center',
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders with formatBorder formatting', () => {
		prompts.box('message', 'title', {
			input: mocks.input,
			output: mocks.output,
			width: 'auto',
			formatBorder: (text: string) => styleText('red', text),
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders wide characters with auto width', () => {
		const messages = ['이게 첫 번째 줄이에요', 'これは次の行です'];
		prompts.box(messages.join('\n'), '这是标题', {
			input: mocks.input,
			output: mocks.output,
			width: 'auto',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders wide characters with specified width', () => {
		const messages = ['이게 첫 번째 줄이에요', 'これは次の行です'];
		prompts.box(messages.join('\n'), '这是标题', {
			input: mocks.input,
			output: mocks.output,
			width: 0.2,
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
