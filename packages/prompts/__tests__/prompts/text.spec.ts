import { mockPrompt } from '@clack/core';
import { randomUUID } from 'crypto';
import color from 'picocolors';
import { formatPlaceholder, symbol, S_BAR, S_BAR_END, text } from '../../src';

jest.mock('is-unicode-supported', () => ({
	__esModule: true,
	default: () => true,
}));

describe('text', () => {
	const mock = mockPrompt();
	const message = 'test message';
	const cursor = color.inverse(color.hidden('_'));

	afterEach(() => {
		mock.close();
	});

	it('should render initial state', async () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		text({ message });

		expect(mock.frame).toBe(`${title}${color.cyan(S_BAR)}  ${cursor}\n${color.cyan(S_BAR_END)}\n`);
	});

	it('should render initial state with placeholder', async () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;
		const placeholder = randomUUID();

		text({ message, placeholder });

		expect(mock.frame).toBe(
			`${title}${color.cyan(S_BAR)}  ${formatPlaceholder(placeholder)}\n${color.cyan(S_BAR_END)}\n`
		);
	});

	it('should render error', async () => {
		const value = randomUUID();
		const title = `${color.gray(S_BAR)}\n${symbol('error')}  ${message}\n`;
		const error = 'invalid value';

		text({
			message,
			validate: (value) => {
				return error;
			},
		});
		mock.submit(value);

		expect(mock.frame).toBe(
			`${title}${color.yellow(S_BAR)}  ${value + cursor}\n${color.yellow(
				S_BAR_END
			)}  ${color.yellow(error)}\n`
		);
	});

	it('should submit initialValue', async () => {
		const value = randomUUID();
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		text({ message, initialValue: value });
		mock.submit();

		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}  ${color.dim(value)}`);
	});

	it('should submit value', async () => {
		const value = randomUUID();
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		text({ message });
		mock.submit(value);

		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}  ${color.dim(value)}`);
	});

	it('should render cancel', async () => {
		const value = randomUUID();
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		text({ message });
		mock.cancel(value);

		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(value))}\n${color.gray(S_BAR)}`
		);
	});
});
