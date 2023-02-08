import * as readline from "node:readline";
import { stdin, stdout } from 'node:process';
import c from 'picocolors';

const dirs = new Set(['up', 'down', 'left']);
export async function typeahead(question: string, complete: (value: string) => string | undefined, { render = (value: string, completion: string = '') => `${value}${c.dim(completion.slice(value.length))}`, input = stdin, output = stdout } = {}) {
    let value = '';
    let completion: string | undefined;
    
    output.write(question);
    const prefix = question.split('\n').at(-1) ?? '';
    const initialPrompt = render('');
    const lines = initialPrompt.split('\n');
    const dx = -999;
    const dy = -1 * (lines.length - 1);

    const rl = readline.promises.createInterface({
        input,
        output,
        prompt: '',
        tabSize: 1
    });
    rl.prompt();
    output.write(prefix);

    const reset = () => {
        completion = value ? complete(value) : undefined;
        readline.moveCursor(output, dx, dy, () => {
            readline.clearScreenDown(output, () => {
                output.write(`${prefix}${render(value, completion)}`);
                if (completion) {
                    const move = completion.slice(value.length).length * -1;
                    output.moveCursor(move, 0);
                }
            })
        });
    }

    return new Promise((resolve) => {
        const keypress = (_, { name }) => {
            if (dirs.has(name)) return;
            if (name === 'return') {
                rl.close();
                resolve(completion ?? value);
                input.off('keypress', keypress)
            } else if ((name === 'tab' || name === 'right') && completion) {
                value = completion;
                return reset();
            } else {
                const newValue = rl.line.trim();
                if (newValue != value) {
                    value = newValue;
                }
                return reset();
            }
        };
        input.on('keypress', keypress)
    })
}
