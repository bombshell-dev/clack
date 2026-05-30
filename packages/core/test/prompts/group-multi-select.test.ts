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
				group1: [{ value: 'a' }, { value: 'b' }],
			},
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	describe('cursor with separators', () => {
		// Flattened layout: [groupHeader(0), a(1), separator(2), b(3)]
		test('cursor skips separator options', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [
						{ value: 'a' },
						{ type: 'separator' as const, label: '---' },
						{ value: 'b' },
					],
				},
			});
			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(1);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(3);
			input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(1);
		});

		// Flattened layout: [groupHeader(0), separator(1), a(2), b(3)]
		test('initial cursor skips separator at fallback position', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [
						{ type: 'separator' as const, label: '---' },
						{ value: 'a' },
						{ value: 'b' },
					],
				},
			});
			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(2);
		});

		// Flattened layout: [groupHeader(0), a(1), separator(2)]
		test('cursor skips separator at end when wrapping', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [
						{ value: 'a' },
						{ type: 'separator' as const, label: '---' },
					],
				},
			});
			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(1);
		});

		// Flattened: [g1Header(0), a(1), g2Header(2), separator(3), b(4)]
		test('cursor skips separators across groups', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }],
					group2: [
						{ type: 'separator' as const, label: '---' },
						{ value: 'b' },
					],
				},
			});
			instance.prompt();

			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(1);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(2);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(4);
		});

		// Flattened: [groupHeader(0), a(1), separator(2), b(3)]
		test('toggleValue is a no-op on separator', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [
						{ value: 'a' },
						{ type: 'separator' as const, label: '---' },
						{ value: 'b' },
					],
				},
			});
			instance.prompt();

			expect(instance.value).toEqual([]);

			instance.cursor = 2;
			input.emit('keypress', 'space', { name: 'space' });
			expect(instance.value).toEqual([]);

			instance.cursor = 3;
			input.emit('keypress', 'space', { name: 'space' });
			expect(instance.value).toEqual(['b']);

			instance.cursor = 2;
			input.emit('keypress', 'space', { name: 'space' });
			expect(instance.value).toEqual(['b']);
		});

		// Flattened: [groupHeader(0), separator(1), a(2), b(3)]
		test('cursorAt skips separator', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [
						{ type: 'separator' as const, label: '---' },
						{ value: 'a' },
						{ value: 'b' },
					],
				},
				cursorAt: 'a',
			});
			instance.prompt();

			expect(instance.cursor).to.equal(2);
		});
	});

	describe('selectableGroups = false with separators', () => {
		// Flattened: [groupHeader(0), separator(1), a(2), b(3)]
		test('cursor skips separator and group header', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				selectableGroups: false,
				options: {
					group1: [
						{ type: 'separator' as const, label: '---' },
						{ value: 'a' },
						{ value: 'b' },
					],
				},
			});
			instance.prompt();

			expect(instance.cursor).to.equal(2);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(3);
		});
	});
});
