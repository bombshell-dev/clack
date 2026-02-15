import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Prompt, { type PromptOptions } from './prompt.js';

export interface EditorOptions extends PromptOptions<string, EditorPrompt> {
	exec?: string;
	postfix?: string;
	tmpdir?: string;
}

export default class EditorPrompt extends Prompt<string> {
	exec: string | undefined;
	path: string | undefined;

	private create() {
		spawnSync(this.exec as string, [this.path as string]);
		this.value = readFileSync(this.path as string, 'utf8');
	}

	constructor(opts: EditorOptions) {
		super(opts, false);
		this.value = opts.initialValue ?? '';

		this.exec =
			opts.exec ?? process.env.EDITOR ?? (process.platform === 'win32' ? 'notepad' : 'nano');
		this.path = join(opts.tmpdir ?? tmpdir(), `ce-${randomUUID()}${opts.postfix ?? ''}`);
		writeFileSync(this.path, this.value as string);

		this.on('key', (_char, key) => {
			if (key.name === 'return') {
				this.create();
			}
		});

		this.on('finalize', () => {
			rmSync(this.path as string);
		});
	}
}
