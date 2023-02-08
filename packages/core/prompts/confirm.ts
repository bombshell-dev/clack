import * as readline from "node:readline";
import { stdin, stdout } from 'node:process';

import { block } from '../utils.js'

const dirs = new Set(['up', 'down', 'right', 'left']);
export async function confirm(question: string, { render = (value: boolean) => value ? `[Y] /  N ` : ` Y  / [N]`, input = stdin, output = stdout } = {}) {
    let value = true;
    
    output.write(question);
    const prefix = question.split('\n').at(-1) ?? '';
    const initialPrompt = render(value);
    const lines = initialPrompt.split('\n');
    const dx = -999;
    const dy = -1 * (lines.length - 1);
    output.write(initialPrompt);

    const reset = () => {
        readline.moveCursor(output, dx, dy, () => {
            readline.clearScreenDown(output, () => {
                output.write(`${prefix}${render(value)}`);
            })
        });
    }

    const unblock = block({ input, output, overwrite: false });
    return new Promise((resolve) => {
        const keypress = (char: string, { name }) => {
            if (dirs.has(name)) {
                value = !value;
                return reset();
            } else if (name === 'return') {
                unblock();
                input.off('keypress', keypress);
                resolve(value);
            } else {
                if (char === 'y' || char === 'n') {
                    value = char === 'y';
                    reset();
                    resolve(value);
                    input.off('keypress', keypress);
                }
                return reset();
            }
        }
        input.on('keypress', keypress);
    })
}
