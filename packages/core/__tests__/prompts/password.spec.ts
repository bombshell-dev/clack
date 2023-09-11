import { randomUUID } from 'crypto';
import color from 'picocolors';
import { mockPrompt } from '../../src';
import PasswordPrompt, { PasswordOptions } from '../../src/prompts/password';
import { cursor } from '../utils';

const makeSut = (opts?: Partial<PasswordOptions>) => {
	return new PasswordPrompt({
		...opts,
		render() {
			return this.value;
		},
	}).prompt();
};

describe('PasswordPrompt', () => {
	const mock = mockPrompt<PasswordPrompt>();

	afterEach(() => {
		mock.close();
	});

	it('should mask value', () => {
		const value = randomUUID();

		makeSut();
		mock.emit('value', value);

		expect(mock.maskedValue).toBe(value.replace(/./g, '•'));
	});

	it('should mask value with custom mask', () => {
		const value = randomUUID();

		makeSut({
			mask: '*',
		});
		mock.emit('value', value);

		expect(mock.maskedValue).toBe(value.replace(/./g, '*'));
	});

	it('should change cursor position when cursor changes', () => {
		const value = randomUUID();
		let cursorIndex = value.length;

		makeSut({
			initialValue: value,
		});

		expect(mock.valueWithCursor).toBe(mock.maskedValue + cursor);

		cursorIndex--;
		mock.setCursor(cursorIndex);
		mock.emit('value', value);
		expect(mock.valueWithCursor).toBe(
			mock.maskedValue.slice(0, cursorIndex) +
				color.inverse(mock.maskedValue[cursorIndex]) +
				mock.maskedValue.slice(cursorIndex + 1)
		);

		cursorIndex--;
		mock.setCursor(cursorIndex);
		mock.emit('value', value);
		expect(mock.valueWithCursor).toBe(
			mock.maskedValue.slice(0, cursorIndex) +
				color.inverse(mock.maskedValue[cursorIndex]) +
				mock.maskedValue.slice(cursorIndex + 1)
		);

		cursorIndex += 2;
		mock.setCursor(cursorIndex);
		mock.emit('value', value);
		expect(mock.valueWithCursor).toBe(mock.maskedValue + cursor);
	});

	it('should submit value', () => {
		const value = randomUUID();

		makeSut();
		mock.submit(value);

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe(value);
	});
});
