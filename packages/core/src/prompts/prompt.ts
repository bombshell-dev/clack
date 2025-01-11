import { stdin, stdout } from 'node:process';
import readline, { type Key, type ReadLine } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import { WriteStream } from 'node:tty';
import { cursor, erase } from 'sisteransi';
import wrap from 'wrap-ansi';
import { strLength } from '../utils';

import { CANCEL_SYMBOL, diffLines, isActionKey, setRawMode, settings } from '../utils';

import type { ClackEvents, ClackState } from '../types';
import type { Action } from '../utils';

export interface PromptOptions<Self extends Prompt> {
	render(this: Omit<Self, 'prompt'>): string | undefined;
	placeholder?: string;
	initialValue?: any;
	validate?: ((value: any) => string | Error | undefined) | undefined;
	input?: Readable;
	output?: Writable;
	debug?: boolean;
	signal?: AbortSignal;
}

export type LineOption = 'firstLine' | 'newLine' | 'lastLine';

export interface FormatLineOptions {
	/**
	 * Define the start of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		start: '-'
	 * 	}
	 * })
	 * //=> '- foo'
	 */
	start: string;
	/**
	 * Define the end of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		end: '-'
	 * 	}
	 * })
	 * //=> 'foo -'
	 */
	end: string;
	/**
	 * Define the sides of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		sides: '-'
	 * 	}
	 * })
	 * //=> '- foo -'
	 */
	sides: string;
	/**
	 * Define the style of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		style: (line) => `(${line})`
	 * 	}
	 * })
	 * //=> '(foo)'
	 */
	style: (line: string) => string;
}

export interface FormatOptions extends Record<LineOption, Partial<FormatLineOptions>> {
	/**
	 * Shorthand to define values for each line
	 * @example
	 * format('foo', {
	 * 	default: {
	 * 		start: '-'
	 * 	}
	 * // equals
	 * 	firstLine{
	 * 		start: '-'
	 * 	},
	 * 	newLine{
	 * 		start: '-'
	 * 	},
	 * 	lastLine{
	 * 		start: '-'
	 * 	},
	 * })
	 */
	default: Partial<FormatLineOptions>;
	/**
	 * Define the max width of each line
	 * @example
	 * format('foo bar baz', {
	 * 	maxWidth: 7
	 * })
	 * //=> 'foo bar\nbaz'
	 */
	maxWidth: number;
	minWidth: number;
}

export default class Prompt {
	protected input: Readable;
	protected output: Writable;
	private _abortSignal?: AbortSignal;

	private rl: ReadLine | undefined;
	private opts: Omit<PromptOptions<Prompt>, 'render' | 'input' | 'output'>;
	private _render: (context: Omit<Prompt, 'prompt'>) => string | undefined;
	private _track = false;
	private _prevFrame = '';
	private _subscribers = new Map<string, { cb: (...args: any) => any; once?: boolean }[]>();
	protected _cursor = 0;

	public state: ClackState = 'initial';
	public error = '';
	public value: any;

	constructor(options: PromptOptions<Prompt>, trackValue = true) {
		const { input = stdin, output = stdout, render, signal, ...opts } = options;

		this.opts = opts;
		this.onKeypress = this.onKeypress.bind(this);
		this.close = this.close.bind(this);
		this.render = this.render.bind(this);
		this._render = render.bind(this);
		this._track = trackValue;
		this._abortSignal = signal;

		this.input = input;
		this.output = output;
	}

	/**
	 * Unsubscribe all listeners
	 */
	protected unsubscribe() {
		this._subscribers.clear();
	}

	/**
	 * Set a subscriber with opts
	 * @param event - The event name
	 */
	private setSubscriber<T extends keyof ClackEvents>(
		event: T,
		opts: { cb: ClackEvents[T]; once?: boolean }
	) {
		const params = this._subscribers.get(event) ?? [];
		params.push(opts);
		this._subscribers.set(event, params);
	}

	/**
	 * Subscribe to an event
	 * @param event - The event name
	 * @param cb - The callback
	 */
	public on<T extends keyof ClackEvents>(event: T, cb: ClackEvents[T]) {
		this.setSubscriber(event, { cb });
	}

	/**
	 * Subscribe to an event once
	 * @param event - The event name
	 * @param cb - The callback
	 */
	public once<T extends keyof ClackEvents>(event: T, cb: ClackEvents[T]) {
		this.setSubscriber(event, { cb, once: true });
	}

	/**
	 * Emit an event with data
	 * @param event - The event name
	 * @param data - The data to pass to the callback
	 */
	public emit<T extends keyof ClackEvents>(event: T, ...data: Parameters<ClackEvents[T]>) {
		const cbs = this._subscribers.get(event) ?? [];
		const cleanup: (() => void)[] = [];

		for (const subscriber of cbs) {
			subscriber.cb(...data);

			if (subscriber.once) {
				cleanup.push(() => cbs.splice(cbs.indexOf(subscriber), 1));
			}
		}

		for (const cb of cleanup) {
			cb();
		}
	}

	public prompt() {
		return new Promise<string | symbol>((resolve, reject) => {
			if (this._abortSignal) {
				if (this._abortSignal.aborted) {
					this.state = 'cancel';

					this.close();
					return resolve(CANCEL_SYMBOL);
				}

				this._abortSignal.addEventListener(
					'abort',
					() => {
						this.state = 'cancel';
						this.close();
					},
					{ once: true }
				);
			}

			const sink = new WriteStream(0);
			sink._write = (chunk, encoding, done) => {
				if (this._track) {
					this.value = this.rl?.line.replace(/\t/g, '');
					this._cursor = this.rl?.cursor ?? 0;
					this.emit('value', this.value);
				}
				done();
			};
			this.input.pipe(sink);

			this.rl = readline.createInterface({
				input: this.input,
				output: sink,
				tabSize: 2,
				prompt: '',
				escapeCodeTimeout: 50,
			});
			readline.emitKeypressEvents(this.input, this.rl);
			this.rl.prompt();
			if (this.opts.initialValue !== undefined && this._track) {
				this.rl.write(this.opts.initialValue);
			}

			this.input.on('keypress', this.onKeypress);
			setRawMode(this.input, true);
			this.output.on('resize', this.render);

			this.render();

			this.once('submit', () => {
				this.output.write(cursor.show);
				this.output.off('resize', this.render);
				setRawMode(this.input, false);
				resolve(this.value);
			});
			this.once('cancel', () => {
				this.output.write(cursor.show);
				this.output.off('resize', this.render);
				setRawMode(this.input, false);
				resolve(CANCEL_SYMBOL);
			});
		});
	}

	private onKeypress(char: string, key?: Key) {
		if (this.state === 'error') {
			this.state = 'active';
		}
		if (key?.name) {
			if (!this._track && settings.aliases.has(key.name)) {
				this.emit('cursor', settings.aliases.get(key.name));
			}
			if (settings.actions.has(key.name as Action)) {
				this.emit('cursor', key.name as Action);
			}
		}
		if (char && (char.toLowerCase() === 'y' || char.toLowerCase() === 'n')) {
			this.emit('confirm', char.toLowerCase() === 'y');
		}
		if (char === '\t' && this.opts.placeholder) {
			if (!this.value) {
				this.rl?.write(this.opts.placeholder);
				this.emit('value', this.opts.placeholder);
			}
		}
		if (char) {
			this.emit('key', char.toLowerCase());
		}

		if (key?.name === 'return') {
			if (this.opts.validate) {
				const problem = this.opts.validate(this.value);
				if (problem) {
					this.error = problem instanceof Error ? problem.message : problem;
					this.state = 'error';
					this.rl?.write(this.value);
				}
			}
			if (this.state !== 'error') {
				this.state = 'submit';
			}
		}

		if (isActionKey([char, key?.name, key?.sequence], 'cancel')) {
			this.state = 'cancel';
		}
		if (this.state === 'submit' || this.state === 'cancel') {
			this.emit('finalize');
		}
		this.render();
		if (this.state === 'submit' || this.state === 'cancel') {
			this.close();
		}
	}

	protected close() {
		this.input.unpipe();
		this.input.removeListener('keypress', this.onKeypress);
		this.output.write('\n');
		setRawMode(this.input, false);
		this.rl?.close();
		this.rl = undefined;
		this.emit(`${this.state}`, this.value);
		this.unsubscribe();
	}

	private restoreCursor() {
		const lines =
			wrap(this._prevFrame, process.stdout.columns, { hard: true }).split('\n').length - 1;
		this.output.write(cursor.move(-999, lines * -1));
	}

	public format(text: string, options?: Partial<FormatOptions>): string {
		const getLineOption = <TLine extends LineOption, TKey extends keyof FormatLineOptions>(
			line: TLine,
			key: TKey
		): NonNullable<FormatOptions[TLine][TKey]> => {
			return (
				key === 'style'
					? (options?.[line]?.[key] ?? options?.default?.[key] ?? ((line) => line))
					: (options?.[line]?.[key] ?? options?.[line]?.sides ?? options?.default?.[key] ?? '')
			) as NonNullable<FormatOptions[TLine][TKey]>;
		};
		const getLineOptions = (line: LineOption): Omit<FormatLineOptions, 'sides'> => {
			return {
				start: getLineOption(line, 'start'),
				end: getLineOption(line, 'end'),
				style: getLineOption(line, 'style'),
			};
		};

		const firstLine = getLineOptions('firstLine');
		const newLine = getLineOptions('newLine');
		const lastLine = getLineOptions('lastLine');

		const emptySlots =
			Math.max(
				strLength(firstLine.start + firstLine.end),
				strLength(newLine.start + newLine.end),
				strLength(lastLine.start + lastLine.end)
			) + 2;
		const terminalWidth = process.stdout.columns || 80;
		const maxWidth = options?.maxWidth ?? terminalWidth;
		const minWidth = options?.minWidth ?? 1;

		const formattedLines: string[] = [];
		const paragraphs = text.split(/\n/g);

		for (const paragraph of paragraphs) {
			const words = paragraph.split(/\s/g);
			let currentLine = '';

			for (const word of words) {
				if (strLength(currentLine + word) + emptySlots + 1 <= maxWidth) {
					currentLine += ` ${word}`;
				} else if (strLength(word) + emptySlots >= maxWidth) {
					const splitIndex = maxWidth - strLength(currentLine) - emptySlots - 1;
					formattedLines.push(`${currentLine} ${word.slice(0, splitIndex)}`);

					const chunkLength = maxWidth - emptySlots;
					let chunk = word.slice(splitIndex);
					while (strLength(chunk) > chunkLength) {
						formattedLines.push(chunk.slice(0, chunkLength));
						chunk = chunk.slice(chunkLength);
					}
					currentLine = chunk;
				} else {
					formattedLines.push(currentLine);
					currentLine = word;
				}
			}

			formattedLines.push(currentLine);
		}

		return formattedLines
			.map((line, i, ar) => {
				const opt = <TPosition extends Exclude<keyof FormatLineOptions, 'sides'>>(
					position: TPosition
				): FormatLineOptions[TPosition] => {
					return (
						i === 0 && ar.length === 1
							? (options?.firstLine?.[position] ??
								options?.lastLine?.[position] ??
								firstLine[position])
							: i === 0
								? firstLine[position]
								: i + 1 === ar.length
									? lastLine[position]
									: newLine[position]
					) as FormatLineOptions[TPosition];
				};
				const startLine = opt('start');
				const endLine = opt('end');
				const styleLine = opt('style');
				// only format the line without the leading space.
				const leadingSpaceRegex = /^\s/;
				const styledLine = leadingSpaceRegex.test(line)
					? ` ${styleLine(line.slice(1))}`
					: styleLine(line);
				const fullLine =
					styledLine + ' '.repeat(Math.max(minWidth - strLength(styledLine) - emptySlots, 0));
				return [startLine, fullLine, endLine].join(' ');
			})
			.join('\n');
	}

	private render() {
		const frame = wrap(this._render(this) ?? '', process.stdout.columns, {
			hard: true,
		});
		if (frame === this._prevFrame) return;

		if (this.state === 'initial') {
			this.output.write(cursor.hide);
		} else {
			const diff = diffLines(this._prevFrame, frame);
			this.restoreCursor();
			// If a single line has changed, only update that line
			if (diff && diff?.length === 1) {
				const diffLine = diff[0];
				this.output.write(cursor.move(0, diffLine));
				this.output.write(erase.lines(1));
				const lines = frame.split('\n');
				this.output.write(lines[diffLine]);
				this._prevFrame = frame;
				this.output.write(cursor.move(0, lines.length - diffLine - 1));
				return;
				// If many lines have changed, rerender everything past the first line
			}
			if (diff && diff?.length > 1) {
				const diffLine = diff[0];
				this.output.write(cursor.move(0, diffLine));
				this.output.write(erase.down());
				const lines = frame.split('\n');
				const newLines = lines.slice(diffLine);
				this.output.write(newLines.join('\n'));
				this._prevFrame = frame;
				return;
			}

			this.output.write(erase.down());
		}

		this.output.write(frame);
		if (this.state === 'initial') {
			this.state = 'active';
		}
		this._prevFrame = frame;
	}
}
