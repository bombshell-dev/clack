import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('groupMultiselect (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	afterEach(() => {
		prompts.updateSettings({ withGuide: true });
	});

	test('renders message with options', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				group2: [{ value: 'group2value0' }],
			},
		});

		// Select the first non-group option
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });

		// submit
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can select multiple options', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }, { value: 'group1value2' }],
			},
		});

		// Select the first non-group option
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		// Select the second non-group option
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });

		// submit
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0', 'group1value1']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can select a group', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
		});

		// Select the group as a whole
		mocks.input.emit('keypress', '', { name: 'space' });

		// submit
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0', 'group1value1']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can select a group by selecting all members', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
		});

		// Select the first group option
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		// Select the second group option
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });

		// submit
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0', 'group1value1']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can deselect an option', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
		});

		// Select the first group option
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		// Select the second group option
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		// Deselect it
		mocks.input.emit('keypress', '', { name: 'space' });

		// submit
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders error when nothing selected', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
		});

		// try submit
		mocks.input.emit('keypress', '', { name: 'return' });
		// now select something and submit
		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	describe('selectableGroups = false', () => {
		test('cannot select groups', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input: mocks.input,
				output: mocks.output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
				selectableGroups: false,
			});

			// first selectable item should be group's child
			mocks.input.emit('keypress', '', { name: 'space' });
			mocks.input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0']);
			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('selecting all members of group does not select group', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input: mocks.input,
				output: mocks.output,
				options: {
					group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
				},
				selectableGroups: false,
			});

			// first selectable item should be group's child
			mocks.input.emit('keypress', '', { name: 'space' });
			// select second item
			mocks.input.emit('keypress', '', { name: 'down' });
			mocks.input.emit('keypress', '', { name: 'space' });
			// submit
			mocks.input.emit('keypress', '', { name: 'return' });

			const value = await result;

			expect(value).toEqual(['group1value0', 'group1value1']);
			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	test('can submit empty selection when require = false', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
			required: false,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual([]);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('cursorAt sets initial selection', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
			cursorAt: 'group1value1',
		});

		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value1']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('initial values can be set', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
			initialValues: ['group1value1'],
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value1']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('values can be non-primitive', async () => {
		const value0 = Symbol();
		const value1 = Symbol();
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [
					{ value: value0, label: 'value0' },
					{ value: value1, label: 'value1' },
				],
			},
		});

		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual([value0]);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	describe('groupSpacing', () => {
		test('renders spaced groups', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input: mocks.input,
				output: mocks.output,
				options: {
					group1: [{ value: 'group1value0' }],
					group2: [{ value: 'group2value0' }],
				},
				groupSpacing: 2,
			});

			mocks.input.emit('keypress', '', { name: 'down' });
			mocks.input.emit('keypress', '', { name: 'space' });
			mocks.input.emit('keypress', '', { name: 'return' });

			await result;

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('negative spacing is ignored', async () => {
			const result = prompts.groupMultiselect({
				message: 'foo',
				input: mocks.input,
				output: mocks.output,
				options: {
					group1: [{ value: 'group1value0' }],
					group2: [{ value: 'group2value0' }],
				},
				groupSpacing: -2,
			});

			mocks.input.emit('keypress', '', { name: 'down' });
			mocks.input.emit('keypress', '', { name: 'space' });
			mocks.input.emit('keypress', '', { name: 'return' });

			await result;

			expect(mocks.output.buffer).toMatchSnapshot();
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
			input: mocks.input,
			output: mocks.output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			withGuide: false,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
		});

		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('global withGuide: false removes guide', async () => {
		prompts.updateSettings({ withGuide: false });

		const result = prompts.groupMultiselect({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			options: {
				group1: [{ value: 'group1value0' }, { value: 'group1value1' }],
			},
		});

		mocks.input.emit('keypress', '', { name: 'down' });
		mocks.input.emit('keypress', '', { name: 'space' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toEqual(['group1value0']);
		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
