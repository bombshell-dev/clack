import * as readline from "node:readline";
import { stdin, stdout } from 'node:process';

export const $cancel = Symbol('clack:cancel');

export async function waitForLine(rl: readline.Interface, { prompt = '', output = stdout } = {}) {
    let resolved = false;
    return new Promise<string|symbol>((resolve) => {
        rl.on('line', (line) => {
            if (line.trim()) {
                resolved = true;
                resolve(line.trim());
            } else {
                readline.moveCursor(output, prompt.length, -1);
            }
        });
        rl.once('close', () => {
            if (!resolved) {
                output.write('\n');
            }
            resolve($cancel);
        });
    }).finally(() => {
        rl.close()
    });
}

export class Cursor {
    constructor(private rl: readline.Interface) {}

    hide() {
        this.rl.write('\u001B[?25l');
    }
    show() {
        this.rl.write('\u001B[?25h');
    }
}

export function block({ input = stdin, output = stdout, overwrite = true, hideCursor = true } = {}) {
    const rl = readline.promises.createInterface({
        input,
        output,
        prompt: '',
        tabSize: 1
    });
    const cursor = new Cursor(rl);
    readline.emitKeypressEvents(input, rl)
    if (input.isTTY) input.setRawMode(true);

    const clear = (data: Buffer, { name }) => {
        const str = String(data);
        if (str === '\x03') {
            process.exit(0);
        }
        if (!overwrite) return;
        let dx = name === 'return' ? 0 : -1;
        let dy = name === 'return' ? -1 : 0;

        readline.moveCursor(output, dx, dy, () => {
            readline.clearLine(output, 1, () => {
                input.once('keypress', clear);
            });
        })
    }
    if (hideCursor) cursor.hide();
    input.once('keypress', clear);

    return () => {
        input.off('keypress', clear);
        if (hideCursor) cursor.show();
        rl.close();
    }
}

