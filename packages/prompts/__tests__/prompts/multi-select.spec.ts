import { mockPrompt, SelectPrompt } from '@clack/core';
import color from 'picocolors';
import { multiselect } from '../../src';
import { opt } from '../../src/prompts/multi-select';
import {
	limitOptions,
	Option,
	symbol,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_ACTIVE,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED
} from '../../src/utils';

const options: Option<string>[] = [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }];

const formatOptions = (
	opts: Option<string>[] = options,
	value: string[] = [],
	cursor: number = 0,
	maxItems: number = 5
): string => {
	return `${color.cyan(S_BAR)}  ${limitOptions({
		cursor: cursor,
		options: opts,
		maxItems: maxItems,
		style: (item, active) => {
			const selected = value.includes(item.value);
			return opt(
				item,
				active && selected
					? 'active-selected'
					: selected
					? 'selected'
					: active
					? 'active'
					: 'inactive'
			);
		},
	}).join(`\n${color.cyan(S_BAR)}  `)}`.replace(new RegExp(`(${opts[cursor].value}).+`), '$1');
};

describe('multiselect', () => {
	const mock = mockPrompt<SelectPrompt<{ value: string }>>();
	const message = 'test message';

	afterEach(() => {
		mock.close();
	});

	it('should format option state with hint', () => {
		const option: Option<string> = {
			label: 'Foo',
			value: 'foo',
			hint: 'bar',
		};

		multiselect({ message, options });
		const hint = color.dim(`(${option.hint})`);

		expect(opt(option, 'active')).toBe(`${color.cyan(S_CHECKBOX_ACTIVE)} ${option.label} ${hint}`);
		expect(opt(option, 'active-selected')).toBe(
			`${color.green(S_CHECKBOX_SELECTED)} ${option.label} ${hint}`
		);
	});

	it('should format option state without hint', () => {
		const option: Option<string> = {
			label: 'Foo',
			value: 'foo',
		};

		multiselect({ message, options });

		expect(opt(option, 'active')).toBe(`${color.cyan(S_CHECKBOX_ACTIVE)} ${option.label}`);
		expect(opt(option, 'active-selected')).toBe(
			`${color.green(S_CHECKBOX_SELECTED)} ${option.label}`
		);
		expect(opt(option, 'cancelled')).toBe(`${color.strikethrough(color.dim(option.label))}`);
		expect(opt(option, 'inactive')).toBe(
			`${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(option.label)}`
		);
		option.label = undefined;
		expect(opt(option, 'inactive')).toBe(
			`${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(option.value)}`
		);
	});

	it('should render initial state', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		multiselect({ message, options });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(`${title}${formatOptions()}\n${color.cyan(S_BAR_END)}\n`);
	});

	it('should render initial state with initialValue', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		multiselect({
			message,
			options,
			initialValues: [options[0].value, options[1].value],
			cursorAt: options[1].value,
		});

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(
			`${title}${formatOptions(options, mock.value, 1)}\n${color.cyan(S_BAR_END)}\n`
		);
	});

	it('should render error', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('error')}  ${message}`;

		multiselect({ message, options });
		mock.submit();
		const errorLines = mock.error.split('\n');

		expect(mock.state).toBe('error');
		expect(mock.frame).toBe(
			[
				title,
				`${color.yellow(S_BAR)}  ` +
					limitOptions({
						cursor: 0,
						maxItems: undefined,
						options,
						style(option, active) {
							const selected = mock.value.includes(option.value);
							return opt(
								option,
								active && selected
									? 'active-selected'
									: selected
									? 'selected'
									: active
									? 'active'
									: 'inactive'
							);
						},
					})
						.join(`\n${color.yellow(S_BAR)}  `)
						.replace(new RegExp(`(${options[0].value}).+`), '$1'),
				`${color.yellow(S_BAR_END)}  ${color.yellow(errorLines[0])}`,
				`${color.hidden('-')}  ${errorLines[1]}`,
				'',
			].join('\n')
		);
	});

	it('should render cancel', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		multiselect({ message, options });
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}`);
	});

	it('should render cancel with value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		multiselect({ message, options });
		mock.cancel([options[0].value, options[1].value]);

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${[options[0], options[1]]
				.map((option) => opt(option, 'cancelled'))
				.join(color.dim(', '))}\n${color.gray(S_BAR)}`
		);
	});

	it('should submit value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		multiselect({ message, options });
		mock.submit([options[0].value, options[1].value]);

		expect(mock.state).toBe('submit');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${color.dim(options[0].value)}${color.dim(', ')}${color.dim(
				options[1].value
			)}`
		);
	});

	it('should return value on submit', async () => {
		const promise = multiselect({ message, options });

		mock.submit([options[0].value, options[1].value]);
		const result = await promise;

		expect(result).toStrictEqual([options[0].value, options[1].value]);
	});

	it('should render limited options', async () => {
		const extendedOptions = options.concat(options);
		const cursor = 0;

		multiselect({ message, options: extendedOptions, maxItems: 5 });
		mock.setCursor(cursor);
		mock.updateFrame();

		const INACTIVE_CHECKBOX = color.dim(S_CHECKBOX_INACTIVE);
		const ACTIVE_CHECKBOX = color.cyan(S_CHECKBOX_ACTIVE);
		expect(mock.frame).toBe(
			[
				color.gray(S_BAR),
				`${symbol('initial')}  ${message}`,
				`${color.cyan(S_BAR)}  ${ACTIVE_CHECKBOX} ${extendedOptions[cursor].value}`,
				`${color.cyan(S_BAR)}  ${INACTIVE_CHECKBOX} ${color.dim(
					extendedOptions[cursor + 1].value
				)}`,
				`${color.cyan(S_BAR)}  ${INACTIVE_CHECKBOX} ${color.dim(
					extendedOptions[cursor + 2].value
				)}`,
				`${color.cyan(S_BAR)}  ${INACTIVE_CHECKBOX} ${color.dim(
					extendedOptions[cursor + 3].value
				)}`,
				`${color.cyan(S_BAR)}  ${color.dim('...')}`,
				color.cyan(S_BAR_END),
				'',
			].join('\n')
		);
	});
});
