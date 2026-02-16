import { vol } from 'memfs';
import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as EditorPrompt } from '../../src/prompts/editor.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

vi.mock('node:fs');
vi.mock('node:os');
vi.mock('node:child_process');

describe('EditorPrompt', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
		vol.reset();
		vol.fromJSON({ './tmp/cache-abc': 'foo', './newtmp/cache-123': 'bar' }, '/');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders render() result', () => {
		const instance = new EditorPrompt({
			input,
			output,
			render: () => 'foo',
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('sets value and submits on confirm', () => {
		const instance = new EditorPrompt({
			input,
			output,
			render: () => 'foo',
			initialValue: 'hello',
		});

		instance.prompt();
		input.emit('keypress', '\r', { name: 'return' });

		expect(instance.value).to.equal('hello');
		expect(instance.state).to.equal('submit');
	});

	describe('path', () => {
		const UUID_RE = [8, 4, 4, 4, 12].map((len) => `[a-z0-9]{${len}}`).join('-');
		const createRegexp = (dir: string, postfix = '') =>
			new RegExp(['', dir, `ce-${UUID_RE}${postfix}`].join('[\\\\/]'));

		test('default', () => {
			const instance = new EditorPrompt({
				input,
				output,
				render: () => 'foo',
			});

			instance.prompt();

			expect(instance.path).to.match(createRegexp('tmp'));
		});

		test('custom temp dir', () => {
			const instance = new EditorPrompt({
				input,
				output,
				render: () => 'foo',
				tmpdir: '/newtmp',
			});

			instance.prompt();

			expect(instance.path).to.match(createRegexp('newtmp'));
		});

		test('custom temp file postfix/extension', () => {
			const instance = new EditorPrompt({
				input,
				output,
				render: () => 'foo',
				postfix: '.txt',
			});

			instance.prompt();

			expect(instance.path).to.match(createRegexp('tmp', '.txt'));
		});
	});

	describe('executable', () => {
		const originalEnv = structuredClone(process.env);
		const originalPlatform = process.platform;

		afterEach(() => {
			process.env = originalEnv;
			Object.defineProperty(process, 'platform', { value: originalPlatform });
		});

		test.each(['linux', 'win32'])('%s default', (platform) => {
			Object.defineProperty(process, 'platform', { value: platform });

			const instance = new EditorPrompt({
				input,
				output,
				render: () => 'foo',
			});

			instance.prompt();

			expect(instance.bin).to.equal(platform === 'win32' ? 'notepad' : 'nano');
			expect(instance.args.length).to.equal(1);
		});

		test('custom binary', () => {
			const instance = new EditorPrompt({
				input,
				output,
				render: () => 'foo',
				bin: 'vim',
			});

			instance.prompt();

			expect(instance.bin).to.equal('vim');
		});

		test('custom binary via env.EDITOR', () => {
			process.env.EDITOR = 'nvim';

			const instance = new EditorPrompt({
				input,
				output,
				render: () => 'foo',
			});

			instance.prompt();

			expect(instance.bin).to.equal('nvim');
		});

		test('custom args', () => {
			const instance = new EditorPrompt({
				input,
				output,
				render: () => 'foo',
				args: (p) => ['--', p],
			});

			instance.prompt();

			expect(instance.args.length).to.equal(2);
			expect(instance.args[0]).to.equal('--');
		});
	});
});
