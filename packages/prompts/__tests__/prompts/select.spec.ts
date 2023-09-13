import { mockPrompt, SelectPrompt } from '@clack/core';
import color from 'picocolors';
import { select } from '../../src';
import { opt } from '../../src/prompts/select';
import {
	limitOptions,
	Option,
	symbol,
	S_BAR,
	S_BAR_END,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE
} from '../../src/utils';

const options: Option<string>[] = [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }];

const formatOptions = (
	opts: Option<string>[] = options,
	cursor: number = 0,
	maxItems: number = 5
): string => {
	return `${color.cyan(S_BAR)}  ${limitOptions({
		cursor: cursor,
		options: opts,
		maxItems: maxItems,
		style: (item, active) => opt(item, active ? 'active' : 'inactive'),
	}).join(`\n${color.cyan(S_BAR)}  `)}`.replace(new RegExp(`(${opts[cursor].value}).+`), '$1');
};

describe('select', () => {
	const mock = mockPrompt<SelectPrompt<{ value: string }>>();
	const message = 'test message';

	afterEach(() => {
		mock.close();
	});

	it('should format option state', () => {
		const option: Option<string> = {
			label: 'Foo',
			value: 'foo',
			hint: 'bar',
		};

		select({ message, options });

		expect(opt(option, 'selected')).toBe(`${color.dim(option.label)}`);
		expect(opt(option, 'active')).toBe(
			`${color.green(S_RADIO_ACTIVE)} ${option.label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`
		);
		expect(opt(option, 'cancelled')).toBe(`${color.strikethrough(color.dim(option.label))}`);
		expect(opt(option, 'inactive')).toBe(
			`${color.dim(S_RADIO_INACTIVE)} ${color.dim(option.label)}`
		);
		option.label = undefined;
		expect(opt(option, 'inactive')).toBe(
			`${color.dim(S_RADIO_INACTIVE)} ${color.dim(option.value)}`
		);
	});

	it('should render initial state', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		select({ message, options });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(`${title}${formatOptions()}\n${color.cyan(S_BAR_END)}\n`);
	});

	it('should render initial state with initialValue', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		select({ message, options, initialValue: options[1].value });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(`${title}${formatOptions(options, 1)}\n${color.cyan(S_BAR_END)}\n`);
	});

	it('should render cancel', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		select({ message, options });
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${color.strikethrough(
				color.dim(options[0].value)
			)}\n${color.gray(S_BAR)}`
		);
	});

	it('should render cancel with value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		select({ message, options });
		mock.setCursor(1);
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${color.strikethrough(
				color.dim(options[1].value)
			)}\n${color.gray(S_BAR)}`
		);
	});

	it('should submit value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		select({ message, options });
		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}  ${color.dim(options[0].value)}`);
	});

	it('should return value on submit', async () => {
		const promise = select({ message, options });

		mock.submit();
		const result = await promise;

		expect(result).toBe(options[0].value);
	});

	it('should render limited options', async () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}`;

		const extendedOptions = options.concat(options);
		select({ message, options: extendedOptions, maxItems: 5 });
		const cursor = 0;
		mock.setCursor(cursor);
		mock.updateFrame();

		const INACTIVE_RADIO = color.dim(S_RADIO_INACTIVE);
		const ACTIVE_RADIO = color.green(S_RADIO_ACTIVE);
		expect(mock.frame).toBe(
			[
				title,
				`${color.cyan(S_BAR)}  ${ACTIVE_RADIO} ${extendedOptions[cursor].value}`,
				`${color.cyan(S_BAR)}  ${INACTIVE_RADIO} ${color.dim(extendedOptions[cursor + 1].value)}`,
				`${color.cyan(S_BAR)}  ${INACTIVE_RADIO} ${color.dim(extendedOptions[cursor + 2].value)}`,
				`${color.cyan(S_BAR)}  ${INACTIVE_RADIO} ${color.dim(extendedOptions[cursor + 3].value)}`,
				`${color.cyan(S_BAR)}  ${color.dim('...')}`,
				color.cyan(S_BAR_END),
				'',
			].join('\n')
		);
	});
});
