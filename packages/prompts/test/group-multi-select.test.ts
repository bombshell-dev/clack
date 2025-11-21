import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('groupMultiselect (isCI = %s)', (isCI) => {
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

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.groupMultiselect({
			message: 'Select a fruit',
			options: {
				group1: [{ value: 'group1value0' }],
				group2: [{ value: 'group2value0' }],
			},
			input,
			output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});
});
