import { styleText } from 'node:util';
import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as MultiLinePrompt } from '../../src/prompts/multi-line.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('MultiLinePrompt', () => {
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
		const instance = new MultiLinePrompt({
			input,
			output,
			render: () => 'foo',
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('sets default value on finalize if no value', async () => {
		const instance = new MultiLinePrompt({
			input,
			output,
			render: () => 'foo',
			defaultValue: 'bleep bloop',
		});
		const resultPromise = instance.prompt();
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal('bleep bloop');
	});

	test('keeps value on finalize', async () => {
		const instance = new MultiLinePrompt({
			input,
			output,
			render: () => 'foo',
			defaultValue: 'bleep bloop',
		});
		const resultPromise = instance.prompt();
		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal('x');
	});

	describe('cursor', () => {
		test('can get cursor', () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});

			expect(instance.cursor).to.equal(0);
		});
	});

	describe('userInputWithCursor', () => {
		test('returns value on submit', () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			expect(instance.userInputWithCursor).to.equal('x');
		});

		test('highlights cursor position', () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			const keys = 'foo';
			for (let i = 0; i < keys.length; i++) {
				input.emit('keypress', keys[i], { name: keys[i] });
			}
			input.emit('keypress', undefined, { name: 'left' });
			expect(instance.userInputWithCursor).to.equal(`fo${styleText('inverse', 'o')}`);
		});

		test('shows cursor at end if beyond value', () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			const keys = 'foo';
			for (let i = 0; i < keys.length; i++) {
				input.emit('keypress', keys[i], { name: keys[i] });
			}
			input.emit('keypress', undefined, { name: 'right' });
			expect(instance.userInputWithCursor).to.equal('foo█');
		});
	});

	describe('key', () => {
		test('return inserts newline', () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			expect(instance.userInput).to.equal('x\n');
		});

		test('double return submits', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('double return inserts when showSubmit is true', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
				showSubmit: true,
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '\t', { name: 'tab' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x\n\n');
		});

		test('typing when submit selected jumps back to text', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
				showSubmit: true,
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '\t', { name: 'tab' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '\t', { name: 'tab' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xy');
		});

		test('space inserts space', () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', ' ', { name: 'space' });
			expect(instance.userInput).to.equal('x ');
		});

		test('shift modifier inserts uppercase characters', () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'X', { name: 'x', shift: true });
			expect(instance.userInput).to.equal('xX');
		});

		test('backspace deletes previous char', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'backspace' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('delete deletes next char', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', '', { name: 'delete' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('delete does nothing at end', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'delete' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('backspace does nothing at start', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', '', { name: 'backspace' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('left moves left until start', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('yx');
		});

		test('right moves right until end', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', '', { name: 'right' });
			input.emit('keypress', '', { name: 'right' });
			input.emit('keypress', 'z', { name: 'z' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xyz');
		});

		test('left moves across lines', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', 'z', { name: 'z' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xz\ny');
		});

		test('right moves across lines', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', '', { name: 'left' });
			input.emit('keypress', '', { name: 'right' });
			input.emit('keypress', '', { name: 'right' });
			input.emit('keypress', 'z', { name: 'z' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x\nyz');
		});

		test('up moves up a line', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'up' });
			input.emit('keypress', 'z', { name: 'z' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xz\ny');
		});

		test('down moves down a line', async () => {
			const instance = new MultiLinePrompt({
				input,
				output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			input.emit('keypress', 'x', { name: 'x' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', 'y', { name: 'y' });
			input.emit('keypress', '', { name: 'up' });
			input.emit('keypress', '', { name: 'down' });
			input.emit('keypress', 'z', { name: 'z' });
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x\nyz');
		});
	});
});
