import { emitKeypressEvents, Interface as ReadlineInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline';
import { WriteStream } from 'node:tty';
import { Readable, Writable } from 'node:stream';
import { formatWithOptions } from 'node:util';
import { cursor, erase } from 'sisteransi';

interface Message {
    content: string;
    count: number;
}
class Logger {
    globalMessages: Message[] = [];
	messages: Message[] = [];
	rl: ReadlineInterface;
	output: WriteStream;
	state = 'initial';

	constructor({ input = stdin, output = stdout } = {}) {
		this.output = output;
		const sink = new WriteStream(0);
		sink._write = (chunk, encoding, done) => {
			done();
		};
		input.pipe(sink);
        setRawMode(input, true);
		this.rl = createInterface({
			input,
			output: sink,
			tabSize: 2,
			prompt: '',
			escapeCodeTimeout: 50,
		});
		output.write(cursor.hide);
        this.log = this.log.bind(this);
        this.#hookGlobalConsole();

        input.on('keypress', (char: string) => {
            if (char === '\x03') {
                this.close();
                process.exit(0);
            }
        })
	}

    #originalConsole: Console | undefined;
    #hookGlobalConsole() {
        this.#originalConsole = globalThis.console;
        globalThis.console = new Proxy(console, {
            get: (target, property, receiver) => {
                return (...args: any) => {
                    const content = formatWithOptions({ colors: true,  }, ...args);
                    this.globalMessages.push({ content, count: 1 });
                    this.render()
                    
                };
            }
        })
    }

	log(...args: any) {
        const content = formatWithOptions({ colors: true }, ...args);
        if (this.messages.at(-1)?.content === content) {
            this.messages.at(-1)!.count++;
        } else {
            this.messages.push({ content, count: 1 });
        }
		this.render();
	}
	close() {
        this.state = 'final';
        this.render();
		this.rl.close();
        if (this.#originalConsole) {
            globalThis.console = this.#originalConsole;
        }
		this.output.write(cursor.show);
	}

	render() {
		if (this.state !== 'initial') {
			this.output.write(cursor.move(-999, this.output.rows * -1));
			this.output.write(erase.down());
		}
		this.output.write('Welcome to the dev server\n');
        let lines = [];

        for (const message of this.messages) {
            if (message.count === 1) {
                lines.push(message.content)
            } else {
                lines.push(`${message.content} (x${message.count})`)
            }
        }
        for (const message of this.globalMessages) {
            if (message.count === 1) {
                lines.push(message.content)
            } else {
                lines.push(`${message.content} (x${message.count})`)
            }
        }
        let frame = lines.join('\n');
        if (this.state !== 'final') {
            frame += Array.from({ length: this.output.rows - lines.length - 1 }, () => '').join('\n');
        }
		this.output.write(frame);

        if (this.state !== 'final') {
            this.output.write(`Ctrl + C to quit\n`);
        }
		if (this.state === 'initial') {
			this.state = 'active';
		}
        if (this.state === 'final') {
            this.output.write('\n');
        }
	}
}

export function logger() {
	const log = new Logger();

	return log;
}

function setRawMode(input: Readable, value: boolean) {
	if ((input as typeof stdin).isTTY) (input as typeof stdin).setRawMode(value);
}
