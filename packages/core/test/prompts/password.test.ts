import color from 'picocolors';
import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as PasswordPrompt } from '../../src/prompts/password.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('PasswordPrompt', () => {
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
		const instance = new PasswordPrompt({
			input,
			output,
			render: () => 'foo',
		});
		// leave the promise hanging since we don't want to submit in this test
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	describe('cursor', () => {
		test('can get cursor', () => {
			const instance = new PasswordPrompt({
				input,
				output,
				render: () => 'foo',
			});

			expect(instance.cursor).to.equal(0);
		});
	});

	describe('userInputWithCursor', () => {
		test('returns masked value on submit', () => {
			const instance = new PasswordPrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			const keys = 'foo';
			for (let i = 0; i < keys.length; i++) {
				input.emit('keypress', keys[i], { name: keys[i] });
			}
			input.emit('keypress', '', { name: 'return' });
			expect(instance.userInputWithCursor).to.equal('•••');
		});

		test('renders marker at end', () => {
			const instance = new PasswordPrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			expect(instance.userInputWithCursor).to.equal(`•${color.inverse(color.hidden('_'))}`);
		});

		test('renders cursor inside value', () => {
			const instance = new PasswordPrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', 'z', { name: 'z' });
			input.emit('keypress', 'left', { name: 'left' });
			input.emit('keypress', 'left', { name: 'left' });
			expect(instance.userInputWithCursor).to.equal(`•${color.inverse('•')}•`);
		});

		test('renders custom mask', () => {
			const instance = new PasswordPrompt({
				input,
				output,
				render: () => 'foo',
				mask: 'X',
			});
			instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			expect(instance.userInputWithCursor).to.equal(`X${color.inverse(color.hidden('_'))}`);
		});
	});
});
