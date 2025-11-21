import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as MultiSelectPrompt } from '../../src/prompts/multi-select.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('MultiSelectPrompt', () => {
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
		const instance = new MultiSelectPrompt({
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
			const instance = new MultiSelectPrompt({
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
			const instance = new MultiSelectPrompt({
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
			const instance = new MultiSelectPrompt({
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
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
			});

			instance.prompt();

			input.emit('keypress', 'left', { name: 'left' });
			expect(instance.cursor).to.equal(1);
		});

		test('initial values is selected', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
				initialValues: ['bar'],
			});
			instance.prompt();
			expect(instance.value).toEqual(['bar']);
		});

		test('select all when press "a" key', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
			});
			instance.prompt();

			input.emit('keypress', 'down', { name: 'down' });
			input.emit('keypress', 'space', { name: 'space' });
			input.emit('keypress', 'a', { name: 'a' });
			expect(instance.value).toEqual(['foo', 'bar']);
		});

		test('select invert when press "i" key', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar' }],
			});
			instance.prompt();

			input.emit('keypress', 'down', { name: 'down' });
			input.emit('keypress', 'space', { name: 'space' });
			input.emit('keypress', 'i', { name: 'i' });
			expect(instance.value).toEqual(['foo']);
		});

		test('disabled options are skipped', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
			});
			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(2);
			input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(0);
		});

		test('initial cursorAt on disabled option', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
				cursorAt: 'bar',
			});
			instance.prompt();

			expect(instance.cursor).to.equal(2);
		});
	});

	describe('toggleAll', () => {
		test('selects all enabled options', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
			});
			instance.prompt();

			input.emit('keypress', 'a', { name: 'a' });
			expect(instance.value).toEqual(['foo', 'baz']);
		});

		test('unselects all enabled options if all selected', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [{ value: 'foo' }, { value: 'bar', disabled: true }, { value: 'baz' }],
				initialValues: ['foo', 'baz'],
			});
			instance.prompt();

			input.emit('keypress', 'a', { name: 'a' });
			expect(instance.value).toEqual([]);
		});
	});

	describe('toggleInvert', () => {
		test('inverts selection of enabled options', () => {
			const instance = new MultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: [
					{ value: 'foo' },
					{ value: 'bar', disabled: true },
					{ value: 'baz' },
					{ value: 'qux' },
				],
				initialValues: ['foo', 'baz'],
			});
			instance.prompt();

			input.emit('keypress', 'i', { name: 'i' });
			expect(instance.value).toEqual(['qux']);
		});
	});
});
