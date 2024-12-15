import { stdin, stdout } from 'node:process';
import type { Key } from 'node:readline';
import * as readline from 'node:readline';
import type { Readable } from 'node:stream';
import { cursor } from 'sisteransi';
import { hasAliasKey } from './aliases';

export * from './aliases';
export * from './string';

const isWindows = globalThis.process.platform.startsWith('win');

export const CANCEL_SYMBOL = Symbol('clack:cancel');

export function isCancel(value: unknown): value is symbol {
	return value === CANCEL_SYMBOL;
}

export function setRawMode(input: Readable, value: boolean) {
	const i = input as typeof stdin;

	if (i.isTTY) i.setRawMode(value);
}

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

	const clear = (data: Buffer, { name, sequence }: Key) => {
		const str = String(data);
		if (hasAliasKey([str, name, sequence], 'cancel')) {
			if (hideCursor) output.write(cursor.show);
			process.exit(0);
			return;
		}
		if (!overwrite) return;
		const dx = name === 'return' ? 0 : -1;
		const dy = name === 'return' ? -1 : 0;

		readline.moveCursor(output, dx, dy, () => {
			readline.clearLine(output, 1, () => {
				input.once('keypress', clear);
			});
		});
	};
	if (hideCursor) output.write(cursor.hide);
	input.once('keypress', clear);

	return () => {
		input.off('keypress', clear);
		if (hideCursor) output.write(cursor.show);

		// Prevent Windows specific issues: https://github.com/natemoo-re/clack/issues/176
		if (input.isTTY && !isWindows) input.setRawMode(false);

		// @ts-expect-error fix for https://github.com/nodejs/node/issues/31762#issuecomment-1441223907
		rl.terminal = false;
		rl.close();
	};
}

function ansiRegex(): RegExp {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
	].join('|');

	return new RegExp(pattern, 'g');
}

function stripAnsi(str: string): string {
	return str.replace(ansiRegex(), '');
}

function isControlCharacter(code: number): boolean {
	return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

function isCombiningCharacter(code: number): boolean {
	return code >= 0x300 && code <= 0x36f;
}

function isSurrogatePair(code: number): boolean {
	return code >= 0xd800 && code <= 0xdbff;
}

export function strLength(str: string): number {
	if (str === '') {
		return 0;
	}

	// Remove ANSI escape codes from the input string.
	const stripedStr = stripAnsi(str);

	let length = 0;

	for (let i = 0; i < stripedStr.length; i++) {
		const code = stripedStr.codePointAt(i);

		if (!code || isControlCharacter(code) || isCombiningCharacter(code)) {
			continue;
		}

		if (isSurrogatePair(code)) {
			i++; // Skip the next code unit.
		}

		length++;
	}

	return length;
}
