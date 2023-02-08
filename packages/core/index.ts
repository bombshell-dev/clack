export { default as Prompt, isCancel } from "./prompts/prompt.js";
export { default as TextPrompt } from './prompts/text.js';
export { default as SelectPrompt } from './prompts/select.js';
export { default as ConfirmPrompt } from './prompts/confirm.js';
// export { select } from './prompts/select.js';
// export { confirm } from './prompts/confirm.js';
// export { typeahead } from './prompts/typeahead.js';

// export function createSpinner(frames: string[], { delay = 100, input = stdin, output = stdout } = {}) {
//     const rl = readline.promises.createInterface({
//         input,
//         output,
//     });
//     let done = false;
//     let i = 0;
//     let prev = '';
//     const clear = () => {
//         readline.moveCursor(output, prev.length * -1, 0);
//         readline.clearLine(output, 1);
//     }
//     const log = (message: string) => {
//         clear();
//         output.write(message);
//         prev = message;
//     }
//     input.setRawMode(true);
    
//     return {
//         start(text: string) {
//             rl.pause()
//             rl.on('close', () => {
//                 done = true;
//                 clear();
//             })
//             log(`${frames[0]}${text}`);

//             const loop = async () => {
//                 if (done) return;
//                 if (i < frames.length - 1) {
//                     i++;
//                 } else {
//                     i = 0;
//                 }
//                 let frame = frames[i]
//                 log(`${frame}${text}`);
//                 if (!done) await sleep(delay);
//                 loop();
//             }

//             sleep(delay).then(() => loop());
//         },
//         stop() {
//             done = true;
//             rl.close();
// 			clear();
//         }
//     }
    
// }

// export async function confirm(question: string, { initial = true, input = stdin, output = stdout } = {}) {
//     const lines = question.split('\n');
//     const prompt = lines.at(-1) ?? '';
//     const rl = readline.promises.createInterface({
//         input,
//         output,
//         prompt,
//     });
//     let prev = '';
//     const clear = () => {
//         readline.moveCursor(output, prev.length * -1, 0);
//         clearLine(output, 1);
//     }
//     const log = (message: string) => {
//         if (message === prev) return;
//         clear();
//         output.write(message);
//         prev = message;
//     }
//     output.write(question);
//     let value = initial;
//     return new Promise((resolve) => {
//         readline.emitKeypressEvents(input);
//         if (input.isTTY) input.setRawMode(true);
//         rl.prompt(false);
//         let needsClear = false;
//         input.on('keypress', (char, { name }) => {
//             if (char && needsClear) {
//                 clear();
//                 needsClear = false;
//             }
//             if (char === 'y' || char === 'n') {
//                 readline.moveCursor(output, -1, 0);
//                 clearLine(output, 1);
//                 resolve(char === 'y');
//                 return;
//             }
//             if (!char && ['up', 'right', 'down', 'left'].includes(name)) {
//                 log(`[${name}]`)
//                 needsClear = true;
//                 return
//             }
//             readline.moveCursor(output, -1, 0);
//             clearLine(output, 1);
//         })
//         rl.on('line', () => {
//             clear();
//             resolve(value);
//         })
//         rl.on('close', () => resolve($cancel));
//     }).finally(() => rl.close())
// }

// export async function load({ spinner, start, end, while: update = () => sleep(100) }: { spinner: ReturnType<typeof createSpinner>, start: string, end: string, while: (...args: any) => Promise<any> }) {
// 	const act = update().finally(() => spinner.stop());
//     const tooslow = Symbol('slow');
//     const result = await Promise.race([sleep(500).then(() => tooslow), act]);
//     if (result === tooslow) {
//         spinner.start(start);
//         await act;
//         spinner.stop();
//     };
//     stdout.write(end + '\n');
// }
