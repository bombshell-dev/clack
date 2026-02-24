import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Prompt, { type PromptOptions } from './prompt.js';

export interface EditorOptions extends PromptOptions<string, EditorPrompt> {
	bin?: string;
	args?: (path: string) => Array<string>;
	postfix?: string;
	tmpdir?: string;
}

export default class EditorPrompt extends Prompt<string> {
	bin!: string;
	args!: Array<string>;
	path!: string;

	private create() {
		spawnSync(this.bin, this.args);
		this.value = readFileSync(this.path, 'utf8');
	}

	constructor(opts: EditorOptions) {
		super(opts, false);
		this.value = opts.initialValue ?? '';

		this.bin =
			opts.bin ?? process.env.EDITOR ?? (process.platform === 'win32' ? 'notepad' : 'nano');
		this.path = join(opts.tmpdir ?? tmpdir(), `ce-${randomUUID()}${opts.postfix ?? ''}`);
		this.args = opts?.args?.(this.path) ?? [this.path];
		writeFileSync(this.path, this.value as string);

		this.on('key', (_char, key) => {
			if (key.name === 'return') {
				this.create();
			}
		});

		this.on('finalize', () => {
			rmSync(this.path);
		});
	}
}
