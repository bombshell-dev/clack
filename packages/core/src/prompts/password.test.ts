import { styleText } from 'node:util';
import { cursor } from 'sisteransi';
import { beforeEach, describe, expect, test } from 'vitest';
import { default as PasswordPrompt } from './password.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe('PasswordPrompt', () => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('renders render() result', () => {
		const instance = new PasswordPrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});
		// leave the promise hanging since we don't want to submit in this test
		instance.prompt();
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	describe('cursor', () => {
		test('can get cursor', () => {
			const instance = new PasswordPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});

			expect(instance.cursor).to.equal(0);
		});
	});

	describe('userInputWithCursor', () => {
		test('returns masked value on submit', () => {
			const instance = new PasswordPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			const keys = 'foo';
			for (let i = 0; i < keys.length; i++) {
				mocks.input.emit('keypress', keys[i], { name: keys[i] });
			}
			mocks.input.emit('keypress', '', { name: 'return' });
			expect(instance.userInputWithCursor).to.equal('•••');
		});

		test('renders marker at end', () => {
			const instance = new PasswordPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			expect(instance.userInputWithCursor).to.equal(`•${styleText(['inverse', 'hidden'], '_')}`);
		});

		test('renders cursor inside value', () => {
			const instance = new PasswordPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			});
			instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			mocks.input.emit('keypress', 'y', { name: 'y' });
			mocks.input.emit('keypress', 'z', { name: 'z' });
			mocks.input.emit('keypress', undefined, { name: 'left' });
			mocks.input.emit('keypress', undefined, { name: 'left' });
			expect(instance.userInputWithCursor).to.equal(`•${styleText('inverse', '•')}•`);
		});

		test('renders custom mask', () => {
			const instance = new PasswordPrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				mask: 'X',
			});
			instance.prompt();
			mocks.input.emit('keypress', 'x', { name: 'x' });
			expect(instance.userInputWithCursor).to.equal(`X${styleText(['inverse', 'hidden'], '_')}`);
		});
	});
});
