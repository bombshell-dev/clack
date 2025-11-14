import { stdin, stdout } from 'node:process';
import readline, { type Key, type ReadLine } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import { wrapAnsi } from 'fast-wrap-ansi';
import { cursor, erase } from 'sisteransi';
import type { ClackEvents, ClackState } from '../types.js';
import type { Action } from '../utils/index.js';
import {
	CANCEL_SYMBOL,
	diffLines,
	getRows,
	isActionKey,
	setRawMode,
	settings,
} from '../utils/index.js';

export interface PromptOptions<TValue, Self extends Prompt<TValue>> {
	render(this: Omit<Self, 'prompt'>): string | undefined;
	initialValue?: any;
	initialUserInput?: string;
	validate?: ((value: TValue | undefined) => string | Error | undefined) | undefined;
	input?: Readable;
	output?: Writable;
	debug?: boolean;
	signal?: AbortSignal;
}

export default class Prompt<TValue> {
	protected input: Readable;
	protected output: Writable;
	private _abortSignal?: AbortSignal;

	private rl: ReadLine | undefined;
	private opts: Omit<PromptOptions<TValue, Prompt<TValue>>, 'render' | 'input' | 'output'>;
	private _render: (context: Omit<Prompt<TValue>, 'prompt'>) => string | undefined;
	private _track = false;
	private _prevFrame = '';
	private _subscribers = new Map<string, { cb: (...args: any) => any; once?: boolean }[]>();
	protected _cursor = 0;

	public state: ClackState = 'initial';
	public error = '';
	public value: TValue | undefined;
	public userInput = '';

	constructor(options: PromptOptions<TValue, Prompt<TValue>>, trackValue = true) {
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
	private setSubscriber<T extends keyof ClackEvents<TValue>>(
		event: T,
		opts: { cb: ClackEvents<TValue>[T]; once?: boolean }
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
	public on<T extends keyof ClackEvents<TValue>>(event: T, cb: ClackEvents<TValue>[T]) {
		this.setSubscriber(event, { cb });
	}

	/**
	 * Subscribe to an event once
	 * @param event - The event name
	 * @param cb - The callback
	 */
	public once<T extends keyof ClackEvents<TValue>>(event: T, cb: ClackEvents<TValue>[T]) {
		this.setSubscriber(event, { cb, once: true });
	}

	/**
	 * Emit an event with data
	 * @param event - The event name
	 * @param data - The data to pass to the callback
	 */
	public emit<T extends keyof ClackEvents<TValue>>(
		event: T,
		...data: Parameters<ClackEvents<TValue>[T]>
	) {
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
		return new Promise<TValue | symbol | undefined>((resolve) => {
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

			this.rl = readline.createInterface({
				input: this.input,
				tabSize: 2,
				prompt: '',
				escapeCodeTimeout: 50,
				terminal: true,
			});
			this.rl.prompt();

			if (this.opts.initialUserInput !== undefined) {
				this._setUserInput(this.opts.initialUserInput, true);
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

	protected _isActionKey(char: string | undefined, _key: Key): boolean {
		return char === '\t';
	}

	protected _setValue(value: TValue | undefined): void {
		this.value = value;
		this.emit('value', this.value);
	}

	protected _setUserInput(value: string | undefined, write?: boolean): void {
		this.userInput = value ?? '';
		this.emit('userInput', this.userInput);
		if (write && this._track && this.rl) {
			this.rl.write(this.userInput);
			this._cursor = this.rl.cursor;
		}
	}

	protected _clearUserInput(): void {
		this.rl?.write(null, { ctrl: true, name: 'u' });
		this._setUserInput('');
	}

	private onKeypress(char: string | undefined, key: Key) {
		if (this._track && key.name !== 'return') {
			if (key.name && this._isActionKey(char, key)) {
				this.rl?.write(null, { ctrl: true, name: 'h' });
			}
			this._cursor = this.rl?.cursor ?? 0;
			this._setUserInput(this.rl?.line);
		}

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

		// Call the key event handler and emit the key event
		this.emit('key', char?.toLowerCase(), key);

		if (key?.name === 'return') {
			if (this.opts.validate) {
				const problem = this.opts.validate(this.value);
				if (problem) {
					this.error = problem instanceof Error ? problem.message : problem;
					this.state = 'error';
					this.rl?.write(this.userInput);
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
			wrapAnsi(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split('\n')
				.length - 1;
		this.output.write(cursor.move(-999, lines * -1));
	}

	private render() {
		const frame = wrapAnsi(this._render(this) ?? '', process.stdout.columns, {
			hard: true,
			trim: false,
		});
		if (frame === this._prevFrame) return;

		if (this.state === 'initial') {
			this.output.write(cursor.hide);
		} else {
			const diff = diffLines(this._prevFrame, frame);
			const rows = getRows(this.output);
			this.restoreCursor();
			if (diff) {
				const diffOffsetAfter = Math.max(0, diff.numLinesAfter - rows);
				const diffOffsetBefore = Math.max(0, diff.numLinesBefore - rows);
				let diffLine = diff.lines.find((line) => line >= diffOffsetAfter);

				if (diffLine === undefined) {
					this._prevFrame = frame;
					return;
				}

				// If a single line has changed, only update that line
				if (diff.lines.length === 1) {
					this.output.write(cursor.move(0, diffLine - diffOffsetBefore));
					this.output.write(erase.lines(1));
					const lines = frame.split('\n');
					this.output.write(lines[diffLine]);
					this._prevFrame = frame;
					this.output.write(cursor.move(0, lines.length - diffLine - 1));
					return;
					// If many lines have changed, rerender everything past the first line
				} else if (diff.lines.length > 1) {
					if (diffOffsetAfter < diffOffsetBefore) {
						diffLine = diffOffsetAfter;
					} else {
						const adjustedDiffLine = diffLine - diffOffsetBefore;
						if (adjustedDiffLine > 0) {
							this.output.write(cursor.move(0, adjustedDiffLine));
						}
					}
					this.output.write(erase.down());
					const lines = frame.split('\n');
					const newLines = lines.slice(diffLine);
					this.output.write(newLines.join('\n'));
					this._prevFrame = frame;
					return;
				}
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
