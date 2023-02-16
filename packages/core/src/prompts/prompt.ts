import type { Key, ReadLine } from 'node:readline';

import { Readable, Writable } from "node:stream";
import { WriteStream } from 'node:tty';
import { stdin, stdout } from "node:process";
import readline from 'node:readline';
import { cursor, erase } from 'sisteransi';

function diffLines(a: string, b: string) {
  if (a === b) return;

  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const diff: number[] = []

  for (let i = 0; i < Math.max(aLines.length, bLines.length); i++) {
    if (aLines[i] !== bLines[i]) diff.push(i);
  }

  return diff;
}

const cancel = Symbol('clack:cancel');
export function isCancel(value: unknown): value is symbol {
  return value === cancel;
}

function setRawMode(input: Readable, value: boolean) {
  if ((input as typeof stdin).isTTY) (input as typeof stdin).setRawMode(value);
}

const keys = new Set(['up', 'down', 'left', 'right', 'space', 'enter']);

export interface PromptOptions<Self extends Prompt> {
  render(this: Omit<Self, 'prompt'>): string | void;
  placeholder?: string;
  initialValue?: any;
  validate?: ((value: string) => string | void) | undefined;
  input?: Readable;
  output?: Writable;
  debug?: boolean;
}

export type State = 'initial' | 'active' | 'cancel' | 'submit' | 'error';

export default class Prompt {
  protected input: Readable;
  protected output: Writable;
  private rl!: ReadLine;
  private opts: Omit<PromptOptions<Prompt>, 'render' | 'input' | 'output'>;
  private _track: boolean = false;
  private _render: (context: Omit<Prompt, 'prompt'>) => string | void;
  protected _cursor: number = 0;

  public state: State = 'initial';
  public value: any;
  public error: string = '';

  constructor({ render, input = stdin, output = stdout, ...opts }: PromptOptions<Prompt>, trackValue: boolean = true) {
    this.opts = opts;
    this.onKeypress = this.onKeypress.bind(this);
    this.close = this.close.bind(this);
    this.render = this.render.bind(this);
    this._render = render.bind(this);
    this._track = trackValue;

    this.input = input;
    this.output = output;
  }

  public prompt() {
    const sink = new WriteStream(0)
    sink._write = (chunk, encoding, done) => {
      if (this._track) {
        this.value = this.rl.line.replace(/\t/g, '');
        this._cursor = this.rl.cursor;
        this.emit('value', this.value);
      }
      done()
    }
    this.input.pipe(sink);

    this.rl = readline.createInterface({
      input: this.input,
      output: sink,
      tabSize: 2,
      prompt: '',
      escapeCodeTimeout: 50
    })
    readline.emitKeypressEvents(this.input, this.rl);
    this.rl.prompt();
    if (this.opts.initialValue !== undefined && this._track) {
      this.rl.write(this.opts.initialValue);
    }

    this.input.on('keypress', this.onKeypress);
    setRawMode(this.input, true);

    this.render();

    return new Promise<string | symbol>((resolve, reject) => {
      this.once('submit', () => {
        this.output.write(cursor.show);
        setRawMode(this.input, false);
        resolve(this.value);
      })
      this.once('cancel', () => {
        this.output.write(cursor.show);
        setRawMode(this.input, false);
        resolve(cancel);
      })
    })
  }

  private subscribers = new Map<string, ({ cb: (...args: any) => any, once?: boolean })[]>();
  public on(event: string, cb: (...args: any) => any) {
    const arr = this.subscribers.get(event) ?? [];
    arr.push({ cb });
    this.subscribers.set(event, arr);
  }
  public once(event: string, cb: (...args: any) => any) {
    const arr = this.subscribers.get(event) ?? [];
    arr.push({ cb, once: true });
    this.subscribers.set(event, arr);
  }
  public emit(event: string, ...data: any[]) {
    const cbs = this.subscribers.get(event) ?? [];
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
  private unsubscribe() {
    this.subscribers.clear();
  }

  private onKeypress(char: string, key?: Key) {
    if (this.state === 'error') {
      this.state = 'active';
    }

    switch (key?.name) {
      case 'h':
        this.emit('cursor', 'left');
        break;
      case 'j':
        this.emit('cursor', 'down');
        break;
      case 'k':
        this.emit('cursor', 'up');
        break;
      case 'l':
        this.emit('cursor', 'right');
        break;
      default:
        if (keys.has(key?.name ?? '')) {
          this.emit('cursor', key?.name);
        }
        break;
    }
    if (char && (char.toLowerCase() === 'y' || char.toLowerCase() === 'n')) {
      this.emit('confirm', char.toLowerCase() === 'y');
    }

    if (key?.name === 'return') {
      if ('placeholder' in this.opts && !this.value) {
        this.value = this.opts.placeholder;
      }
      if (this.opts.validate) {
        const problem = this.opts.validate(this.value);
        if (problem) {
          this.error = problem;
          this.state = 'error';
          this.rl.write(this.value);
        }
      }
      if (this.state !== 'error') {
        this.state = 'submit';
      }
    }
    if (char === '\x03') {
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
    this.input.removeListener('keypress', this.onKeypress)
    this.output.write('\n');
    setRawMode(this.input, false);
    this.rl.close();
    this.emit(`${this.state}`, this.value);
    this.unsubscribe();
  }

  // TODO: handle wrapping
  private restoreCursor() {
    const lines = this._prevFrame.split('\n').length - 1;
    this.output.write(cursor.move(-999, lines * -1));
  }

  private _prevFrame = '';
  private render() {
    const frame = this._render(this) ?? '';
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
        this.output.write(cursor.move(0, lines.length - diffLine - 1))
        return;
        // If many lines have changed, rerender everything past the first line
      } else if (diff && diff?.length > 1) {
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
