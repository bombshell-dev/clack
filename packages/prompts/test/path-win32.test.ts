import { vol } from 'memfs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

// Run the path prompt with Windows path semantics on any OS. memfs only knows
// POSIX paths here, so `C:\tmp\foo` is looked up as `/tmp/foo`.
vi.mock('node:path', async (importOriginal) => {
	const { win32 } = await importOriginal<typeof import('node:path')>();
	return { ...win32, default: win32 };
});

vi.mock('node:fs', async () => {
	const { fs } = await import('memfs');
	const toPosix = (path: string) => path.replace(/^[a-zA-Z]:/, '').replaceAll('\\', '/');
	return {
		existsSync: (path: string) => fs.existsSync(toPosix(path)),
		lstatSync: (path: string) => fs.lstatSync(toPosix(path)),
		readdirSync: (path: string) => fs.readdirSync(toPosix(path)),
	};
});

describe('path (win32)', () => {
	let output: MockWritable;
	let input: MockReadable;

	beforeEach(() => {
		output = new MockWritable();
		input = new MockReadable();
		vol.reset();
		vol.fromJSON(
			{
				'./foo/bar.txt': '1',
				'./hello/world.jpg': '2',
				'./root.zip': '3',
			},
			'/tmp'
		);
	});

	test('directory mode traverses into child when trailing backslash entered', async () => {
		const result = prompts.path({
			message: 'foo',
			initialValue: 'C:\\tmp',
			directory: true,
			input,
			output,
		});

		input.emit('keypress', '\\', { name: '\\' });
		input.emit('keypress', '', { name: 'return' });
		// cancel instead of hanging if return did not submit
		input.emit('keypress', '', { name: 'escape' });

		expect(await result).toBe('C:\\tmp\\foo');
	});

	test('directory mode lists children of an initial value ending in a backslash', async () => {
		const result = prompts.path({
			message: 'foo',
			initialValue: 'C:\\tmp\\',
			directory: true,
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', '', { name: 'escape' });

		expect(await result).toBe('C:\\tmp\\foo');
	});
});
