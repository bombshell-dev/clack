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

	test('don\'t overflow', () => {
	  const lorem = [
	    "Eiusmod sint officia proident qui ex tempor laborum ut. Voluptate dolore excepteur sunt adipisicing laborum non ea elit. Consectetur exercitation ad laboris consectetur nisi minim labore culpa enim. Eiusmod duis minim velit mollit nisi. Laboris magna qui fugiat sit minim. Aliqua id aute sunt proident do tempor mollit nulla veniam exercitation est ipsum occaecat nostrud. Exercitation ullamco proident ex ut et in ut.",
	    "Dolore magna proident id in magna quis. Sunt et laboris Lorem adipisicing nisi id proident qui enim laboris proident do. Fugiat eu commodo exercitation ipsum in aliquip ipsum magna consequat laborum. Id aute enim enim officia in do aliqua voluptate aute nulla proident. Mollit pariatur exercitation sit mollit in exercitation culpa deserunt sunt laboris aliquip cillum mollit ad. Aliquip exercitation adipisicing qui laboris ea do occaecat elit magna commodo sint adipisicing.",
	    "Fugiat veniam non nostrud reprehenderit tempor quis officia ad reprehenderit. Veniam ut est irure est. Laboris reprehenderit dolor dolor id laborum nulla velit et in sunt aliquip. Culpa voluptate dolore enim ut incididunt dolor sint cupidatat enim. Irure sint consectetur minim velit aliquip consequat enim ex in sunt.",
	  ];
		prompts.note(lorem.join("\n"), 'title', {
			input,
			output: Object.assign(output, { columns: 75 }),
		});

		expect(output.buffer).toMatchSnapshot();
	});
});
