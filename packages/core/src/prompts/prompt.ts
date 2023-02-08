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
export function isCancel(value: string|symbol): value is symbol {
  return value === cancel;
}

function setRawMode(input: Readable, value: boolean) {
    if ((input as typeof stdin).isTTY) (input as typeof stdin).setRawMode(value);
}

const keys = new Set(['up', 'down', 'left', 'right']);

export interface PromptOptions<Self extends Prompt> {
    render(this: Omit<Self, 'prompt'>): string | void;
    validate?: ((value: string) => string | void) | undefined;
    input?: Readable;
    output?: Writable;
}

export type State = 'initial' | 'active' | 'cancel' | 'submit' | 'error';

export default class Prompt {
  private input: Readable;
  private output: Writable;
  private rl!: ReadLine;
  private opts: Omit<PromptOptions<Prompt>, 'render'|'input'|'output'>;
  private _render: (context: Omit<Prompt, 'prompt'>) => string | void;
  protected _cursor: number = 0;

  public state: State = 'initial';
  public value: any;
  public error: string = '';

  constructor({ render, input = stdin, output = stdout, ...opts }: PromptOptions<Prompt>) {
    this.opts = opts;
    this.onKeypress = this.onKeypress.bind(this);
    this.close = this.close.bind(this);
    this.render = this.render.bind(this);
    this._render = render.bind(this);

    this.input = input;
    this.output = output;
  }

  public prompt() {
    const sink = new WriteStream(0)
    sink._write = (chunk, encoding, done) => {
      this.value = this.rl.line.replace(/\t/g, '');
      this._cursor = this.rl.cursor;
      this.emit('value', this.value);
      done()
    }
    this.input.pipe(sink);

    this.rl = readline.promises.createInterface({
        input: this.input,
        output: sink,
        tabSize: 2,
        prompt: '',
        escapeCodeTimeout: 50
    })
    readline.emitKeypressEvents(this.input, this.rl);
    this.rl.prompt();

    this.input.on('keypress', this.onKeypress);
    setRawMode(this.input, true);

    this.render();

    return new Promise<string|symbol>((resolve, reject) => {
      this.once('clack:submit', () => {
        resolve(this.value);
      })
      this.once('clack:cancel', () => {
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

    if (key?.name && keys.has(key.name)) {
      this.emit('cursor', key.name);
    }
    if (char === 'y' || char === 'n') {
      this.emit('confirm', char === 'y');
    }

    if (key?.name === 'return') {
      if (this.opts.validate) {
        const problem = this.opts.validate(this.value);
        if (problem) {
          this.error = problem;
          this.state = 'error';
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
    this.input.removeListener('keypress', this.onKeypress)
    this.output.write('\n');
    setRawMode(this.input, false);
    this.rl.close();
    this.emit(`clack:${this.state}`, this.value);
    this.unsubscribe();
  }

  private _prevFrame = '';
  private render() {
    const frame = this._render(this) ?? '';
    if (frame === this._prevFrame) return;
    if (this.state !== 'initial') {
      const diff = diffLines(this._prevFrame, frame);

      this.output.write(cursor.restore);
      
      // If a single line has changed, only update that line
      if (diff && diff?.length === 1) {
        const diffLine = diff[0];
        this.output.write(cursor.move(-1, diffLine));
        this.output.write(erase.lines(1));
        this.output.write(frame.split('\n')[diffLine]);
        this._prevFrame = frame;
        return;
      // If many lines have changed, rerender everything past the first line
      } else if (diff && diff?.length > 1) {
        const diffLine = diff[0];
        this.output.write(cursor.move(-1, diffLine));
        this.output.write(erase.down());
        this.output.write(frame.split('\n').slice(diffLine).join('\n'));
        this._prevFrame = frame;
        return;
      }

      this.output.write(erase.down());
    } else {
      this.output.write(cursor.save);
      this.output.write(cursor.hide);
    }
    
    this.output.write(frame);
    if (this.state === 'initial') {
      this.state = 'active';
    }
    this._prevFrame = frame;
  }
}
