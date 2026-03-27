import { cursor } from 'sisteransi';
import { beforeEach, describe, expect, test } from 'vitest';
import { default as SelectPrompt } from './select.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe('SelectPrompt', () => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('renders render() result', () => {
		const instance = new SelectPrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			options: [{ value: 'foo' }, { value: 'bar' }],
		});
		instance.prompt();
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	describe('cursor', () => {
		test('cursor is index of selected item', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
			});

			instance.prompt();

			expect(instance.cursor).to.equal(0);
			mocks.input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(1);
		});

		test('cursor loops around', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
			});

			instance.prompt();

			expect(instance.cursor).to.equal(0);
			mocks.input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(2);
			mocks.input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(0);
		});

		test('left behaves as up', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
			});

			instance.prompt();

			mocks.input.emit('keypress', 'left', { name: 'left' });
			expect(instance.cursor).to.equal(2);
		});

		test('right behaves as down', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
			});

			instance.prompt();

			mocks.input.emit('keypress', 'left', { name: 'left' });
			expect(instance.cursor).to.equal(1);
		});

		test('initial value is selected', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
				initialValue: 'bar',
			});
			instance.prompt();
			expect(instance.cursor).to.equal(1);
		});

		test('cursor skips disabled options (down)', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
			});
			instance.prompt();
			expect(instance.cursor).to.equal(0);
			mocks.input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(2);
		});

		test('cursor skips disabled options (up)', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				initialValue: 'baz',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
			});
			instance.prompt();
			expect(instance.cursor).to.equal(2);
			mocks.input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(0);
		});

		test('cursor skips initial disabled option', () => {
			const instance = new SelectPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				options: [{ value: 'foo', disabled: true }, { value: 'bar' }, { value: 'baz' }],
			});
			instance.prompt();
			expect(instance.cursor).to.equal(1);
		});
	});
});
