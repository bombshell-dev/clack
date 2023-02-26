import type { Key } from 'node:readline';

import { stdin, stdout } from 'node:process';
import * as readline from 'node:readline';
import { cursor } from 'sisteransi';
// @ts-expect-error no types
import ea from 'eastasianwidth';

export function block({
	input = stdin,
	output = stdout,
	overwrite = true,
	hideCursor = true,
} = {}) {
	const rl = readline.createInterface({
		input,
		output,
		prompt: '',
		tabSize: 1,
	});
	readline.emitKeypressEvents(input, rl);
	if (input.isTTY) input.setRawMode(true);

	const clear = (data: Buffer, { name }: Key) => {
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
		});
	};
	if (hideCursor) process.stdout.write(cursor.hide);
	input.once('keypress', clear);

	return () => {
		input.off('keypress', clear);
		if (hideCursor) process.stdout.write(cursor.show);

		// @ts-expect-error fix for https://github.com/nodejs/node/issues/31762#issuecomment-1441223907
		rl.terminal = false;
		rl.close();
	};
}

// Adapted from https://github.com/chalk/ansi-regex
// @see LICENSE
function ansiRegex() {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
	].join('|');

	return new RegExp(pattern, 'g');
}

export function strip(str: string) {
	return str.replace(ansiRegex(), '');
}

export function width(str: string): number {
	return Array.from(graphemes.segment(str)).map(({ segment: c }) => ea.characterLength(c)).reduce((a, b) => a + b, 0);
}

const words = new Intl.Segmenter([], { granularity: 'word' });
const graphemes = new Intl.Segmenter([], { granularity: 'grapheme' });

export function wrap(str: string, cols = process.stdout.columns): string {
	const parts: string[] = [];
	let part = '';
	let i = 0;
	const handle = (chunk: string, { prefix = "", suffix = '' } = {}) => {
		for (const word of words.segment(chunk)) {
			if (word.segment === '\n') {
				parts.push(part)
				i = 0
				part = ''
				continue;
			}
			const len = width(word.segment);
			// Gracefully handle trailing punctuation by ensuring it is always joined with the previous word
			if (len === 1 && word.segment.trim() && /\W/.test(word.segment)) {
				part += word.segment;
				i += 1
				continue;
			}
			if ((i + len) > cols - 1) {
				parts.push(part.trim())
				i = 0
				part = ''
			}
			part += `${prefix}${word.segment}${suffix}`
			i += len;
		}
	}
	
	const re = ansiRegex();
	let lastIndex = 0;
	let lastPart = "";
	let m;
	while (m = re.exec(str)) {
		const chunk = m.input.slice(lastIndex, m.index);
		const [prefix, suffix] = [lastPart, m[0]]
		if (prefix) {
			const [pCode, sCode] = [Number(prefix.slice(2, -1)), Number(suffix.slice(2, -1))]
			if (sCode > pCode) {
				handle(chunk, { prefix, suffix });
			} else {
				handle(chunk)	
			}
		} else {
			handle(chunk)
		}
		lastPart = m[0];
		lastIndex = m.index + m[0].length;
	}
	const chunk = str.slice(lastIndex);
	handle(chunk);
	parts.push(part);
	
	return parts.map(p => /^\s{2,}/.test(p) ? p : p.trimStart()).join('\n');
}

