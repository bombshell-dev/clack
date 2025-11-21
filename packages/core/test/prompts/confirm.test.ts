import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as ConfirmPrompt } from '../../src/prompts/confirm.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('ConfirmPrompt', () => {
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
		const instance = new ConfirmPrompt({
			input,
			output,
			render: () => 'foo',
			active: 'yes',
			inactive: 'no',
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('sets value and submits on confirm (y)', () => {
		const instance = new ConfirmPrompt({
			input,
			output,
			render: () => 'foo',
			active: 'yes',
			inactive: 'no',
			initialValue: true,
		});

		instance.prompt();
		input.emit('keypress', 'y', { name: 'y' });

		expect(instance.value).to.equal(true);
		expect(instance.state).to.equal('submit');
	});

	test('sets value and submits on confirm (n)', () => {
		const instance = new ConfirmPrompt({
			input,
			output,
			render: () => 'foo',
			active: 'yes',
			inactive: 'no',
			initialValue: true,
		});

		instance.prompt();
		input.emit('keypress', 'n', { name: 'n' });

		expect(instance.value).to.equal(false);
		expect(instance.state).to.equal('submit');
	});

	describe('cursor', () => {
		test('cursor is 1 when inactive', () => {
			const instance = new ConfirmPrompt({
				input,
				output,
				render: () => 'foo',
				active: 'yes',
				inactive: 'no',
				initialValue: false,
			});

			instance.prompt();
			input.emit('keypress', '', { name: 'return' });
			expect(instance.cursor).to.equal(1);
		});

		test('cursor is 0 when active', () => {
			const instance = new ConfirmPrompt({
				input,
				output,
				render: () => 'foo',
				active: 'yes',
				inactive: 'no',
				initialValue: true,
			});

			instance.prompt();
			input.emit('keypress', '', { name: 'return' });
			expect(instance.cursor).to.equal(0);
		});
	});
});
