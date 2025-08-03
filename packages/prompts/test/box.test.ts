import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('box (isCI = %s)', (isCI) => {
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

	test('renders message', () => {
		prompts.box('message', undefined, {
			input,
			output,
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders message with title', () => {
		prompts.box('message', 'some title', {
			input,
			output,
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders as wide as longest line with width: auto', () => {
		prompts.box('short\nsomewhat questionably long line', 'title', {
			input,
			output,
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders as specified width', () => {
		prompts.box('short\nsomewhat questionably long line', 'title', {
			input,
			output,
			width: 0.5,
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('wraps content to fit within specified width', () => {
		prompts.box('foo bar'.repeat(20), 'title', {
			input,
			output,
			width: 0.5,
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders specified titlePadding', () => {
		prompts.box('message', 'title', {
			input,
			output,
			titlePadding: 6,
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders specified contentPadding', () => {
		prompts.box('message', 'title', {
			input,
			output,
			contentPadding: 6,
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders with prefix when includePrefix is true', () => {
		prompts.box('message', 'title', {
			input,
			output,
			includePrefix: true,
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders truncated long titles', () => {
		prompts.box('message', 'foo'.repeat(20), {
			input,
			output,
			width: 0.2,
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('cannot have width larger than 100%', () => {
		prompts.box('message', 'title', {
			input,
			output,
			width: 1.1,
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders rounded corners when rounded is true', () => {
		prompts.box('message', 'title', {
			input,
			output,
			rounded: true,
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders auto width with content longer than title', () => {
		prompts.box('message'.repeat(4), 'title', {
			input,
			output,
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders auto width with title longer than content', () => {
		prompts.box('message', 'title'.repeat(4), {
			input,
			output,
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders left aligned title', () => {
		prompts.box('message', 'title', {
			input,
			output,
			titleAlign: 'left',
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders right aligned title', () => {
		prompts.box('message', 'title', {
			input,
			output,
			titleAlign: 'right',
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders center aligned title', () => {
		prompts.box('message', 'title', {
			input,
			output,
			titleAlign: 'center',
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders left aligned content', () => {
		prompts.box('message', 'title', {
			input,
			output,
			contentAlign: 'left',
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders right aligned content', () => {
		prompts.box('message', 'title', {
			input,
			output,
			contentAlign: 'right',
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders center aligned content', () => {
		prompts.box('message', 'title', {
			input,
			output,
			contentAlign: 'center',
			width: 'auto',
		});

		expect(output.buffer).toMatchSnapshot();
	});
});
