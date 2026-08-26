import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as GroupMultiSelectPrompt } from '../../src/prompts/group-multiselect.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('GroupMultiSelectPrompt', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders render() result', () => {
		const instance = new GroupMultiSelectPrompt({
			input,
			output,
			render: () => 'foo',
			options: {
				group: [{ value: 'foo' }, { value: 'bar' }],
			},
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('does not throw if empty options are provided', () => {
		const instance = new GroupMultiSelectPrompt({
			input,
			output,
			render: () => 'foo',
			options: {},
		});
		instance.prompt();
		expect(() => input.emit('keypress', ' ', { name: 'space' })).not.toThrow();
	});
});
