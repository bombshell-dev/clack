import { styleText } from 'node:util';
import { cursor } from 'sisteransi';
import { beforeEach, describe, expect, test } from 'vitest';
import { default as MultiLinePrompt } from './multi-line.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe('MultiLinePrompt', () => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('renders render() result', () => {
		const instance = new MultiLinePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});
		instance.prompt();
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('sets default value on finalize if no value', async () => {
		const instance = new MultiLinePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			defaultValue: 'bleep bloop',
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal('bleep bloop');
	});

	test('keeps value on finalize', async () => {
		const instance = new MultiLinePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			defaultValue: 'bleep bloop',
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal('x');
	});

	describe('cursor', () => {
		test('can get cursor', () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});

			expect(instance.cursor).to.equal(0);
		});
	});

	describe('userInputWithCursor', () => {
		test('returns value on submit', () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			expect(instance.userInputWithCursor).to.equal('x');
		});

		test('highlights cursor position', () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			const keys = 'foo';
			for (let i = 0; i < keys.length; i++) {
				mocks.input.emit('keypress', keys[i], { name: keys[i] });
			}
			mocks.input.emit('keypress', undefined, { name: 'left' });
			expect(instance.userInputWithCursor).to.equal(`fo${styleText('inverse', 'o')}`);
		});

		test('shows cursor at end if beyond value', () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			const keys = 'foo';
			for (let i = 0; i < keys.length; i++) {
				mocks.input.emit('keypress', keys[i], { name: keys[i] });
			}
			mocks.input.emit('keypress', undefined, { name: 'right' });
			expect(instance.userInputWithCursor).to.equal('foo█');
		});
	});

	describe('key', () => {
		test('return inserts newline', () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			expect(instance.userInput).to.equal('x\n');
		});

		test('double return submits', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('double return inserts when showSubmit is true', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				showSubmit: true,
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '\t', { name: 'tab' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x\n\n');
		});

		test('typing when submit selected jumps back to text', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				showSubmit: true,
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '\t', { name: 'tab' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '\t', { name: 'tab' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xy');
		});

		test('backspace deletes previous char', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'backspace' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('delete deletes next char', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', '', { name: 'delete' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('delete does nothing at end', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'delete' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('backspace does nothing at start', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', '', { name: 'backspace' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x');
		});

		test('left moves left until start', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('yx');
		});

		test('right moves right until end', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', '', { name: 'right' });
			mocks.input.emit('keypress', '', { name: 'right' });
			mocks.input.emit('keypress', 'z', { name: 'z' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xyz');
		});

		test('left moves across lines', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', 'z', { name: 'z' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xz\ny');
		});

		test('right moves across lines', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', '', { name: 'left' });
			mocks.input.emit('keypress', '', { name: 'right' });
			mocks.input.emit('keypress', '', { name: 'right' });
			mocks.input.emit('keypress', 'z', { name: 'z' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x\nyz');
		});

		test('up moves up a line', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'up' });
			mocks.input.emit('keypress', 'z', { name: 'z' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('xz\ny');
		});

		test('down moves down a line', async () => {
			const instance = new MultiLinePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', '', { name: 'up' });
			mocks.input.emit('keypress', '', { name: 'down' });
			mocks.input.emit('keypress', 'z', { name: 'z' });
			mocks.input.emit('keypress', '', { name: 'return' });
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('x\nyz');
		});
	});
});
