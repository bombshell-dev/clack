import { styleText } from 'node:util';
import { cursor } from 'sisteransi';
import { beforeEach, describe, expect, test } from 'vitest';
import { default as TextPrompt } from './text.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe('TextPrompt', () => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('renders render() result', () => {
		const instance = new TextPrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});
		// leave the promise hanging since we don't want to submit in this test
		instance.prompt();
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('sets default value on finalize if no value', async () => {
		const instance = new TextPrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			defaultValue: 'bleep bloop',
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal('bleep bloop');
	});

	test('keeps value on finalize', async () => {
		const instance = new TextPrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			defaultValue: 'bleep bloop',
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal('x');
	});

	describe('cursor', () => {
		test('can get cursor', () => {
			const instance = new TextPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});

			expect(instance.cursor).to.equal(0);
		});
	});

	describe('userInputWithCursor', () => {
		test('returns value on submit', () => {
			const instance = new TextPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', '', { name: 'return' });
			expect(instance.userInputWithCursor).to.equal('x');
		});

		test('highlights cursor position', () => {
			const instance = new TextPrompt({
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
			const instance = new TextPrompt({
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

		test('does not use placeholder as value when pressing enter', async () => {
			const instance = new TextPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				placeholder: '  (hit Enter to use default)',
				defaultValue: 'default-value',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('default-value');
		});

		test('returns empty string when no value and no default', async () => {
			const instance = new TextPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				placeholder: '  (hit Enter to use default)',
			});
			const resultPromise = instance.prompt();
			mocks.input.emit('keypress', '', { name: 'return' });
			const result = await resultPromise;
			expect(result).to.equal('');
		});
	});
});
