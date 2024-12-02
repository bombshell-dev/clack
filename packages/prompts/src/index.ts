import {
	block,
	ConfirmPrompt,
	GroupMultiSelectPrompt,
	isCancel,
	MultiSelectPrompt,
	PasswordPrompt,
	SelectKeyPrompt,
	SelectPrompt,
	State,
	TextPrompt,
} from '@clack/core';
import isUnicodeSupported from 'is-unicode-supported';
import color from 'picocolors';
import { Colors } from 'picocolors/types';
import { cursor, erase } from 'sisteransi';

export { isCancel } from '@clack/core';

const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);
const S_STEP_ACTIVE = s('◆', '*');
const S_STEP_CANCEL = s('■', 'x');
const S_STEP_ERROR = s('▲', 'x');
const S_STEP_SUBMIT = s('◇', 'o');

const S_BAR_START = s('┌', 'T');
const S_BAR = s('│', '|');
const S_BAR_END = s('└', '—');

const S_RADIO_ACTIVE = s('●', '>');
const S_RADIO_INACTIVE = s('○', ' ');
const S_CHECKBOX_ACTIVE = s('◻', '[•]');
const S_CHECKBOX_SELECTED = s('◼', '[+]');
const S_CHECKBOX_INACTIVE = s('◻', '[ ]');
const S_PASSWORD_MASK = s('▪', '•');

const S_BAR_H = s('─', '-');
const S_CORNER_TOP_RIGHT = s('╮', '+');
const S_CONNECT_LEFT = s('├', '+');
const S_CORNER_BOTTOM_RIGHT = s('╯', '+');

const S_INFO = s('●', '•');
const S_SUCCESS = s('◆', '*');
const S_WARN = s('▲', '!');
const S_ERROR = s('■', 'x');

type Color = keyof Omit<Colors, 'isColorSupported'>;
type Formatting = Color[] | Color;

const formatter = (formatting: Formatting) => {
	return (str: string) => {
		if (Array.isArray(formatting)) {
			for (const format of formatting) {
				str = color[format](str);
			}
			return str;
		}
		return color[formatting](str);
	};
};

export type Config = {
	colors: {
		symbol: {
			[key in State]: Formatting;
		};
		log: {
			[key in
				| 'info'
				| 'success'
				| 'step'
				| 'warn'
				| 'error'
				| 'intro'
				| 'cancel'
				| 'outro']: Formatting;
		};
		bar: {
			[key in State | 'title' | 'note' | 'intro' | 'outro' | 'log' | 'spinner']: Formatting;
		};
		radio: {
			active: Formatting;
			inactive: Formatting;
		};
		checkbox: {
			active: Formatting;
			inactive: Formatting;
			selected: Formatting;
		};
		key: {
			neutral: Formatting;
			active: Formatting;
		};
		error: Formatting;
		spinner: Formatting;
	};
};

export let config: Config = {
	colors: {
		symbol: {
			initial: 'cyan',
			active: 'cyan',
			cancel: 'red',
			error: 'yellow',
			submit: 'green',
		},
		log: {
			cancel: 'red',
			intro: 'reset',
			outro: 'reset',

			info: 'blue',
			success: 'green',
			step: 'green',
			warn: 'yellow',
			error: 'red',
		},
		bar: {
			title: 'gray',
			note: 'gray',
			intro: 'gray',
			outro: 'gray',
			log: 'gray',
			spinner: 'gray',

			error: 'yellow',
			submit: 'gray',
			cancel: 'gray',
			initial: 'cyan',
			active: 'cyan',
		},
		radio: {
			active: 'green',
			inactive: 'dim',
		},
		checkbox: {
			active: 'cyan',
			selected: 'green',
			inactive: 'dim',
		},
		key: {
			neutral: ['inverse', 'bgWhite', 'gray'],
			active: ['inverse', 'bgCyan', 'gray'],
		},
		error: 'yellow',
		spinner: 'magenta',
	},
};

export const symbol = (state: State) => {
	const symbolFormatter = formatter(config.colors.symbol[state]);
	switch (state) {
		case 'initial':
		case 'active':
			return symbolFormatter(S_STEP_ACTIVE);
		case 'cancel':
			return symbolFormatter(S_STEP_CANCEL);
		case 'error':
			return symbolFormatter(S_STEP_ERROR);
		case 'submit':
			return symbolFormatter(S_STEP_SUBMIT);
	}
};

interface LimitOptionsParams<TOption> {
	options: TOption[];
	maxItems: number | undefined;
	cursor: number;
	style: (option: TOption, active: boolean) => string;
}

const limitOptions = <TOption>(params: LimitOptionsParams<TOption>): string[] => {
	const { cursor, options, style } = params;

	const paramMaxItems = params.maxItems ?? Infinity;
	const outputMaxItems = Math.max(process.stdout.rows - 4, 0);
	// We clamp to minimum 5 because anything less doesn't make sense UX wise
	const maxItems = Math.min(outputMaxItems, Math.max(paramMaxItems, 5));
	let slidingWindowLocation = 0;

	if (cursor >= slidingWindowLocation + maxItems - 3) {
		slidingWindowLocation = Math.max(Math.min(cursor - maxItems + 3, options.length - maxItems), 0);
	} else if (cursor < slidingWindowLocation + 2) {
		slidingWindowLocation = Math.max(cursor - 2, 0);
	}

	const shouldRenderTopEllipsis = maxItems < options.length && slidingWindowLocation > 0;
	const shouldRenderBottomEllipsis =
		maxItems < options.length && slidingWindowLocation + maxItems < options.length;

	return options
		.slice(slidingWindowLocation, slidingWindowLocation + maxItems)
		.map((option, i, arr) => {
			const isTopLimit = i === 0 && shouldRenderTopEllipsis;
			const isBottomLimit = i === arr.length - 1 && shouldRenderBottomEllipsis;
			return isTopLimit || isBottomLimit
				? color.dim('...')
				: style(option, i + slidingWindowLocation === cursor);
		});
};

export interface TextOptions {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	initialValue?: string;
	validate?: (value: string) => string | void;
}
export const text = (opts: TextOptions) => {
	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		render() {
			const title = `${formatter(config.colors.bar.title)(S_BAR)}\n${symbol(this.state)}  ${
				opts.message
			}\n`;
			const placeholder = opts.placeholder
				? color.inverse(opts.placeholder[0]) + color.dim(opts.placeholder.slice(1))
				: color.inverse(color.hidden('_'));
			const value = !this.value ? placeholder : this.valueWithCursor;
			const barFormatter = formatter(config.colors.bar[this.state]);

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n${barFormatter(S_BAR)}  ${value}\n${barFormatter(
						S_BAR_END
					)}  ${formatter(config.colors.error)(this.error)}\n`;
				case 'submit':
					return `${title}${barFormatter(S_BAR)}  ${color.dim(this.value || opts.placeholder)}`;
				case 'cancel':
					return `${title}${barFormatter(S_BAR)}  ${color.strikethrough(
						color.dim(this.value ?? '')
					)}${this.value?.trim() ? '\n' + barFormatter(S_BAR) : ''}`;
				default:
					return `${title}${barFormatter(S_BAR)}  ${value}\n${barFormatter(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};

export interface PasswordOptions {
	message: string;
	mask?: string;
	validate?: (value: string) => string | void;
}
export const password = (opts: PasswordOptions) => {
	return new PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? S_PASSWORD_MASK,
		render() {
			const title = `${formatter(config.colors.bar.title)(S_BAR)}\n${symbol(this.state)}  ${
				opts.message
			}\n`;
			const value = this.valueWithCursor;
			const masked = this.masked;
			const barFormatter = formatter(config.colors.bar[this.state]);

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n${barFormatter(S_BAR)}  ${masked}\n${barFormatter(
						S_BAR_END
					)}  ${formatter(config.colors.error)(this.error)}\n`;
				case 'submit':
					return `${title}${barFormatter(S_BAR)}  ${color.dim(masked)}`;
				case 'cancel':
					return `${title}${barFormatter(S_BAR)}  ${color.strikethrough(color.dim(masked ?? ''))}${
						masked ? '\n' + barFormatter(S_BAR) : ''
					}`;
				default:
					return `${title}${barFormatter(S_BAR)}  ${value}\n${barFormatter(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};

export interface ConfirmOptions {
	message: string;
	active?: string;
	inactive?: string;
	initialValue?: boolean;
}
export const confirm = (opts: ConfirmOptions) => {
	const active = opts.active ?? 'Yes';
	const inactive = opts.inactive ?? 'No';
	return new ConfirmPrompt({
		active,
		inactive,
		initialValue: opts.initialValue ?? true,
		render() {
			const title = `${formatter(config.colors.bar.title)(S_BAR)}\n${symbol(this.state)}  ${
				opts.message
			}\n`;
			const value = this.value ? active : inactive;
			const barFormatter = formatter(config.colors.bar[this.state]);

			switch (this.state) {
				case 'submit':
					return `${title}${barFormatter(S_BAR)}  ${color.dim(value)}`;
				case 'cancel':
					return `${title}${barFormatter(S_BAR)}  ${color.strikethrough(
						color.dim(value)
					)}\n${barFormatter(S_BAR)}`;
				default: {
					return `${title}${barFormatter(S_BAR)}  ${
						this.value
							? `${formatter(config.colors.radio.active)(S_RADIO_ACTIVE)} ${active}`
							: `${formatter(config.colors.radio.inactive)(S_RADIO_INACTIVE)} ${color.dim(active)}`
					} ${color.dim('/')} ${
						!this.value
							? `${formatter(config.colors.radio.active)(S_RADIO_ACTIVE)} ${inactive}`
							: `${formatter(config.colors.radio.inactive)(S_RADIO_INACTIVE)} ${color.dim(
									inactive
							  )}`
					}\n${barFormatter(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
};

type Primitive = Readonly<string | boolean | number>;

type Option<Value> = Value extends Primitive
	? { value: Value; label?: string; hint?: string }
	: { value: Value; label: string; hint?: string };

export interface SelectOptions<Value> {
	message: string;
	options: Option<Value>[];
	initialValue?: Value;
	maxItems?: number;
}

export const select = <Value>(opts: SelectOptions<Value>) => {
	const opt = (option: Option<Value>, state: 'inactive' | 'active' | 'selected' | 'cancelled') => {
		const label = option.label ?? String(option.value);
		switch (state) {
			case 'selected':
				return `${color.dim(label)}`;
			case 'active':
				return `${formatter(config.colors.radio.active)(S_RADIO_ACTIVE)} ${label} ${
					option.hint ? color.dim(`(${option.hint})`) : ''
				}`;
			case 'cancelled':
				return `${color.strikethrough(color.dim(label))}`;
			default:
				return `${formatter(config.colors.radio.inactive)(S_RADIO_INACTIVE)} ${color.dim(label)}`;
		}
	};

	return new SelectPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			const title = `${formatter(config.colors.bar.title)(S_BAR)}\n${symbol(this.state)}  ${
				opts.message
			}\n`;
			const barFormatter = formatter(config.colors.bar[this.state]);

			switch (this.state) {
				case 'submit':
					return `${title}${barFormatter(S_BAR)}  ${opt(this.options[this.cursor], 'selected')}`;
				case 'cancel':
					return `${title}${barFormatter(S_BAR)}  ${opt(
						this.options[this.cursor],
						'cancelled'
					)}\n${barFormatter(S_BAR)}`;
				default: {
					return `${title}${barFormatter(S_BAR)}  ${limitOptions({
						cursor: this.cursor,
						options: this.options,
						maxItems: opts.maxItems,
						style: (item, active) => opt(item, active ? 'active' : 'inactive'),
					}).join(`\n${barFormatter(S_BAR)}  `)}\n${barFormatter(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};

export const selectKey = <Value extends string>(opts: SelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' = 'inactive'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'selected') {
			return `${color.dim(label)}`;
		} else if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		} else if (state === 'active') {
			return `${formatter(config.colors.key.active)(` ${option.value} `)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		}
		return `${formatter(config.colors.key.neutral)(` ${option.value} `)} ${label} ${
			option.hint ? color.dim(`(${option.hint})`) : ''
		}`;
	};

	return new SelectKeyPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			const title = `${formatter(config.colors.bar.title)(S_BAR)}\n${symbol(this.state)}  ${
				opts.message
			}\n`;
			const barFormatter = formatter(config.colors.bar[this.state]);

			switch (this.state) {
				case 'submit':
					return `${title}${barFormatter(S_BAR)}  ${opt(
						this.options.find((opt) => opt.value === this.value)!,
						'selected'
					)}`;
				case 'cancel':
					return `${title}${barFormatter(S_BAR)}  ${opt(
						this.options[0],
						'cancelled'
					)}\n${barFormatter(S_BAR)}`;
				default: {
					return `${title}${barFormatter(S_BAR)}  ${this.options
						.map((option, i) => opt(option, i === this.cursor ? 'active' : 'inactive'))
						.join(`\n${barFormatter(S_BAR)}  `)}\n${barFormatter(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value | symbol>;
};

export interface MultiSelectOptions<Value> {
	message: string;
	options: Option<Value>[];
	initialValues?: Value[];
	maxItems?: number;
	required?: boolean;
	cursorAt?: Value;
}
export const multiselect = <Value>(opts: MultiSelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'active-selected' | 'submitted' | 'cancelled'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'active') {
			return `${formatter(config.colors.checkbox.active)(S_CHECKBOX_ACTIVE)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		} else if (state === 'selected') {
			return `${formatter(config.colors.checkbox.selected)(S_CHECKBOX_SELECTED)} ${color.dim(
				label
			)}`;
		} else if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		} else if (state === 'active-selected') {
			return `${formatter(config.colors.checkbox.selected)(S_CHECKBOX_SELECTED)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		} else if (state === 'submitted') {
			return `${color.dim(label)}`;
		}
		return `${formatter(config.colors.checkbox.inactive)(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`;
	};

	return new MultiSelectPrompt({
		options: opts.options,
		initialValues: opts.initialValues,
		required: opts.required ?? true,
		cursorAt: opts.cursorAt,
		validate(selected: Value[]) {
			if (this.required && selected.length === 0)
				return `Please select at least one option.\n${color.reset(
					color.dim(
						`Press ${formatter(config.colors.key.neutral)(' space ')} to select, ${formatter(
							config.colors.key.neutral
						)(' enter ')} to submit`
					)
				)}`;
		},
		render() {
			let title = `${formatter(config.colors.bar.title)(S_BAR)}\n${symbol(this.state)}  ${
				opts.message
			}\n`;
			const barFormatter = formatter(config.colors.bar[this.state]);

			const styleOption = (option: Option<Value>, active: boolean) => {
				const selected = this.value.includes(option.value);
				if (active && selected) {
					return opt(option, 'active-selected');
				}
				if (selected) {
					return opt(option, 'selected');
				}
				return opt(option, active ? 'active' : 'inactive');
			};

			switch (this.state) {
				case 'submit': {
					return `${title}${barFormatter(S_BAR)}  ${
						this.options
							.filter(({ value }) => this.value.includes(value))
							.map((option) => opt(option, 'submitted'))
							.join(color.dim(', ')) || color.dim('none')
					}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value }) => this.value.includes(value))
						.map((option) => opt(option, 'cancelled'))
						.join(color.dim(', '));
					return `${title}${barFormatter(S_BAR)}  ${
						label.trim() ? `${label}\n${barFormatter(S_BAR)}` : ''
					}`;
				}
				case 'error': {
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0
								? `${barFormatter(S_BAR_END)}  ${formatter(config.colors.error)(ln)}`
								: `   ${ln}`
						)
						.join('\n');
					return (
						title +
						barFormatter(S_BAR) +
						'  ' +
						limitOptions({
							options: this.options,
							cursor: this.cursor,
							maxItems: opts.maxItems,
							style: styleOption,
						}).join(`\n${barFormatter(S_BAR)}  `) +
						'\n' +
						footer +
						'\n'
					);
				}
				default: {
					return `${title}${barFormatter(S_BAR)}  ${limitOptions({
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						style: styleOption,
					}).join(`\n${barFormatter(S_BAR)}  `)}\n${barFormatter(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};

export interface GroupMultiSelectOptions<Value> {
	message: string;
	options: Record<string, Option<Value>[]>;
	initialValues?: Value[];
	required?: boolean;
	cursorAt?: Value;
}
export const groupMultiselect = <Value>(opts: GroupMultiSelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state:
			| 'inactive'
			| 'active'
			| 'selected'
			| 'active-selected'
			| 'group-active'
			| 'group-active-selected'
			| 'submitted'
			| 'cancelled',
		options: Option<Value>[] = []
	) => {
		const label = option.label ?? String(option.value);
		const isItem = typeof (option as any).group === 'string';
		const next = isItem && (options[options.indexOf(option) + 1] ?? { group: true });
		const isLast = isItem && (next as any).group === true;
		const prefix = isItem ? `${isLast ? S_BAR_END : S_BAR} ` : '';

		if (state === 'active') {
			return `${color.dim(prefix)}${formatter(config.colors.checkbox.active)(
				S_CHECKBOX_ACTIVE
			)} ${label} ${option.hint ? color.dim(`(${option.hint})`) : ''}`;
		} else if (state === 'group-active') {
			return `${prefix}${formatter(config.colors.checkbox.active)(S_CHECKBOX_ACTIVE)} ${color.dim(
				label
			)}`;
		} else if (state === 'group-active-selected') {
			return `${prefix}${formatter(config.colors.checkbox.selected)(
				S_CHECKBOX_SELECTED
			)} ${color.dim(label)}`;
		} else if (state === 'selected') {
			return `${color.dim(prefix)}${formatter(config.colors.checkbox.selected)(
				S_CHECKBOX_SELECTED
			)} ${color.dim(label)}`;
		} else if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		} else if (state === 'active-selected') {
			return `${color.dim(prefix)}${formatter(config.colors.checkbox.selected)(
				S_CHECKBOX_SELECTED
			)} ${label} ${option.hint ? color.dim(`(${option.hint})`) : ''}`;
		} else if (state === 'submitted') {
			return `${color.dim(label)}`;
		}
		return `${color.dim(prefix)}${formatter(config.colors.checkbox.inactive)(
			S_CHECKBOX_INACTIVE
		)} ${color.dim(label)}`;
	};

	return new GroupMultiSelectPrompt({
		options: opts.options,
		initialValues: opts.initialValues,
		required: opts.required ?? true,
		cursorAt: opts.cursorAt,
		validate(selected: Value[]) {
			if (this.required && selected.length === 0)
				return `Please select at least one option.\n${color.reset(
					color.dim(
						`Press ${formatter(config.colors.key.neutral)(' space ')} to select, ${formatter(
							config.colors.key.neutral
						)(' enter ')} to submit`
					)
				)}`;
		},
		render() {
			let title = `${formatter(config.colors.bar.title)(S_BAR)}\n${symbol(this.state)}  ${
				opts.message
			}\n`;
			const barFormatter = formatter(config.colors.bar[this.state]);

			switch (this.state) {
				case 'submit': {
					return `${title}${barFormatter(S_BAR)}  ${this.options
						.filter(({ value }) => this.value.includes(value))
						.map((option) => opt(option, 'submitted'))
						.join(color.dim(', '))}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value }) => this.value.includes(value))
						.map((option) => opt(option, 'cancelled'))
						.join(color.dim(', '));
					return `${title}${barFormatter(S_BAR)}  ${
						label.trim() ? `${label}\n${barFormatter(S_BAR)}` : ''
					}`;
				}
				case 'error': {
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0
								? `${barFormatter(S_BAR_END)}  ${formatter(config.colors.error)(ln)}`
								: `   ${ln}`
						)
						.join('\n');
					return `${title}${barFormatter(S_BAR)}  ${this.options
						.map((option, i, options) => {
							const selected =
								this.value.includes(option.value) ||
								(option.group === true && this.isGroupSelected(`${option.value}`));
							const active = i === this.cursor;
							const groupActive =
								!active &&
								typeof option.group === 'string' &&
								this.options[this.cursor].value === option.group;
							if (groupActive) {
								return opt(option, selected ? 'group-active-selected' : 'group-active', options);
							}
							if (active && selected) {
								return opt(option, 'active-selected', options);
							}
							if (selected) {
								return opt(option, 'selected', options);
							}
							return opt(option, active ? 'active' : 'inactive', options);
						})
						.join(`\n${barFormatter(S_BAR)}  `)}\n${footer}\n`;
				}
				default: {
					return `${title}${barFormatter(S_BAR)}  ${this.options
						.map((option, i, options) => {
							const selected =
								this.value.includes(option.value) ||
								(option.group === true && this.isGroupSelected(`${option.value}`));
							const active = i === this.cursor;
							const groupActive =
								!active &&
								typeof option.group === 'string' &&
								this.options[this.cursor].value === option.group;
							if (groupActive) {
								return opt(option, selected ? 'group-active-selected' : 'group-active', options);
							}
							if (active && selected) {
								return opt(option, 'active-selected', options);
							}
							if (selected) {
								return opt(option, 'selected', options);
							}
							return opt(option, active ? 'active' : 'inactive', options);
						})
						.join(`\n${barFormatter(S_BAR)}  `)}\n${barFormatter(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<Value[] | symbol>;
};

const strip = (str: string) => str.replace(ansiRegex(), '');
export const note = (message = '', title = '') => {
	const lines = `\n${message}\n`.split('\n');
	const titleLen = strip(title).length;
	const len =
		Math.max(
			lines.reduce((sum, ln) => {
				ln = strip(ln);
				return ln.length > sum ? ln.length : sum;
			}, 0),
			titleLen
		) + 2;
	const barFormatter = formatter(config.colors.bar.note);

	const msg = lines
		.map(
			(ln) =>
				`${barFormatter(S_BAR)}  ${color.dim(ln)}${' '.repeat(
					len - strip(ln).length
				)}${barFormatter(S_BAR)}`
		)
		.join('\n');
	process.stdout.write(
		`${barFormatter(S_BAR)}\n${formatter(config.colors.symbol.submit)(
			S_STEP_SUBMIT
		)}  ${color.reset(title)} ${barFormatter(
			S_BAR_H.repeat(Math.max(len - titleLen - 1, 1)) + S_CORNER_TOP_RIGHT
		)}\n${msg}\n${barFormatter(S_CONNECT_LEFT + S_BAR_H.repeat(len + 2) + S_CORNER_BOTTOM_RIGHT)}\n`
	);
};

export const cancel = (message = '') => {
	process.stdout.write(
		`${formatter(config.colors.bar.cancel)(S_BAR_END)}  ${formatter(config.colors.log.cancel)(
			message
		)}\n\n`
	);
};

export const intro = (title = '') => {
	process.stdout.write(
		`${formatter(config.colors.bar.intro)(S_BAR_START)}  ${formatter(config.colors.log.intro)(
			title
		)}\n`
	);
};

export const outro = (message = '') => {
	process.stdout.write(
		`${formatter(config.colors.bar.outro)(S_BAR)}\n${formatter(config.colors.bar.outro)(
			S_BAR_END
		)}  ${formatter(config.colors.log.outro)(message)}\n\n`
	);
};

export type LogMessageOptions = {
	symbol?: string;
};
export const log = {
	message: (
		message = '',
		{ symbol = formatter(config.colors.bar.log)(S_BAR) }: LogMessageOptions = {}
	) => {
		const parts = [`${formatter(config.colors.bar.log)(S_BAR)}`];
		if (message) {
			const [firstLine, ...lines] = message.split('\n');
			parts.push(
				`${symbol}  ${firstLine}`,
				...lines.map((ln) => `${formatter(config.colors.bar.log)(S_BAR)}  ${ln}`)
			);
		}
		process.stdout.write(`${parts.join('\n')}\n`);
	},
	info: (message: string) => {
		log.message(message, { symbol: formatter(config.colors.log.info)(S_INFO) });
	},
	success: (message: string) => {
		log.message(message, { symbol: formatter(config.colors.log.success)(S_SUCCESS) });
	},
	step: (message: string) => {
		log.message(message, { symbol: formatter(config.colors.log.step)(S_STEP_SUBMIT) });
	},
	warn: (message: string) => {
		log.message(message, { symbol: formatter(config.colors.log.warn)(S_WARN) });
	},
	/** alias for `log.warn()`. */
	warning: (message: string) => {
		log.warn(message);
	},
	error: (message: string) => {
		log.message(message, { symbol: formatter(config.colors.log.error)(S_ERROR) });
	},
};

export const spinner = () => {
	const frames = unicode ? ['◒', '◐', '◓', '◑'] : ['•', 'o', 'O', '0'];
	const delay = unicode ? 80 : 120;

	let unblock: () => void;
	let loop: NodeJS.Timeout;
	let isSpinnerActive: boolean = false;
	let _message: string = '';

	const handleExit = (code: number) => {
		const msg = code > 1 ? 'Something went wrong' : 'Canceled';
		if (isSpinnerActive) stop(msg, code);
	};

	const errorEventHandler = () => handleExit(2);
	const signalEventHandler = () => handleExit(1);

	const registerHooks = () => {
		// Reference: https://nodejs.org/api/process.html#event-uncaughtexception
		process.on('uncaughtExceptionMonitor', errorEventHandler);
		// Reference: https://nodejs.org/api/process.html#event-unhandledrejection
		process.on('unhandledRejection', errorEventHandler);
		// Reference Signal Events: https://nodejs.org/api/process.html#signal-events
		process.on('SIGINT', signalEventHandler);
		process.on('SIGTERM', signalEventHandler);
		process.on('exit', handleExit);
	};

	const clearHooks = () => {
		process.removeListener('uncaughtExceptionMonitor', errorEventHandler);
		process.removeListener('unhandledRejection', errorEventHandler);
		process.removeListener('SIGINT', signalEventHandler);
		process.removeListener('SIGTERM', signalEventHandler);
		process.removeListener('exit', handleExit);
	};

	const start = (msg: string = ''): void => {
		isSpinnerActive = true;
		unblock = block();
		_message = msg.replace(/\.+$/, '');
		process.stdout.write(`${formatter(config.colors.bar.spinner)(S_BAR)}\n`);
		let frameIndex = 0;
		let dotsTimer = 0;
		registerHooks();
		loop = setInterval(() => {
			const frame = formatter(config.colors.spinner)(frames[frameIndex]);
			const loadingDots = '.'.repeat(Math.floor(dotsTimer)).slice(0, 3);
			process.stdout.write(cursor.move(-999, 0));
			process.stdout.write(erase.down(1));
			process.stdout.write(`${frame}  ${_message}${loadingDots}`);
			frameIndex = frameIndex + 1 < frames.length ? frameIndex + 1 : 0;
			dotsTimer = dotsTimer < frames.length ? dotsTimer + 0.125 : 0;
		}, delay);
	};

	const stop = (msg: string = '', code: number = 0): void => {
		_message = msg ?? _message;
		isSpinnerActive = false;
		clearInterval(loop);
		const step =
			code === 0
				? formatter(config.colors.symbol.submit)(S_STEP_SUBMIT)
				: code === 1
				? formatter(config.colors.symbol.cancel)(S_STEP_CANCEL)
				: formatter(config.colors.symbol.error)(S_STEP_ERROR);
		process.stdout.write(cursor.move(-999, 0));
		process.stdout.write(erase.down(1));
		process.stdout.write(`${step}  ${_message}\n`);
		clearHooks();
		unblock();
	};

	const message = (msg: string = ''): void => {
		_message = msg ?? _message;
	};

	return {
		start,
		stop,
		message,
	};
};

// Adapted from https://github.com/chalk/ansi-regex
// @see LICENSE
function ansiRegex() {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
	].join('|');

	return new RegExp(pattern, 'g');
}

export type PromptGroupAwaitedReturn<T> = {
	[P in keyof T]: Exclude<Awaited<T[P]>, symbol>;
};

export interface PromptGroupOptions<T> {
	/**
	 * Control how the group can be canceled
	 * if one of the prompts is canceled.
	 */
	onCancel?: (opts: { results: Prettify<Partial<PromptGroupAwaitedReturn<T>>> }) => void;
}

type Prettify<T> = {
	[P in keyof T]: T[P];
} & {};

export type PromptGroup<T> = {
	[P in keyof T]: (opts: {
		results: Prettify<Partial<PromptGroupAwaitedReturn<Omit<T, P>>>>;
	}) => void | Promise<T[P] | void>;
};

/**
 * Define a group of prompts to be displayed
 * and return a results of objects within the group
 */
export const group = async <T>(
	prompts: PromptGroup<T>,
	opts?: PromptGroupOptions<T>
): Promise<Prettify<PromptGroupAwaitedReturn<T>>> => {
	const results = {} as any;
	const promptNames = Object.keys(prompts);

	for (const name of promptNames) {
		const prompt = prompts[name as keyof T];
		const result = await prompt({ results })?.catch((e) => {
			throw e;
		});

		// Pass the results to the onCancel function
		// so the user can decide what to do with the results
		// TODO: Switch to callback within core to avoid isCancel Fn
		if (typeof opts?.onCancel === 'function' && isCancel(result)) {
			results[name] = 'canceled';
			opts.onCancel({ results });
			continue;
		}

		results[name] = result;
	}

	return results;
};

export type Task = {
	/**
	 * Task title
	 */
	title: string;
	/**
	 * Task function
	 */
	task: (message: (string: string) => void) => string | Promise<string> | void | Promise<void>;

	/**
	 * If enabled === false the task will be skipped
	 */
	enabled?: boolean;
};

/**
 * Define a group of tasks to be executed
 */
export const tasks = async (tasks: Task[]) => {
	for (const task of tasks) {
		if (task.enabled === false) continue;

		const s = spinner();
		s.start(task.title);
		const result = await task.task(s.message);
		s.stop(result || task.title);
	}
};
