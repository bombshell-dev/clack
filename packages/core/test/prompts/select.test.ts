import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as SelectPrompt } from '../../src/prompts/select.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('SelectPrompt', () => {
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
		const instance = new SelectPrompt({
			input,
			output,
			render: () => 'foo',
			options: [{ value: 'foo' }, { value: 'bar' }],
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	describe('cursor', () => {
		test('cursor is index of selected item', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
			});

			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(1);
		});

		test('cursor loops around', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
			});

			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(2);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(0);
		});

		test('left behaves as up', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
			});

			instance.prompt();

			input.emit('keypress', 'left', { name: 'left' });
			expect(instance.cursor).to.equal(2);
		});

		test('right behaves as down', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
			});

			instance.prompt();

			input.emit('keypress', 'left', { name: 'left' });
			expect(instance.cursor).to.equal(1);
		});

		test('initial value is selected', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
				initialValue: 'bar',
			});
			instance.prompt();
			expect(instance.cursor).to.equal(1);
		});

		test('cursor skips disabled options (down)', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
			});
			instance.prompt();
			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(2);
		});

		test('cursor skips disabled options (up)', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				initialValue: 'baz',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
			});
			instance.prompt();
			expect(instance.cursor).to.equal(2);
			input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(0);
		});

		test('cursor skips initial disabled option', () => {
			const instance = new SelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo', disabled: true }, { value: 'bar' }, { value: 'baz' }],
			});
			instance.prompt();
			expect(instance.cursor).to.equal(1);
		});
	});
});
