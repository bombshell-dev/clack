import { vol } from 'memfs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

vi.mock('node:fs');

describe.each(['true', 'false'])('text (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
		vol.reset();
		vol.fromJSON(
			{
				'./foo/bar.txt': '1',
				'./foo/baz.text': '2',
				'./hello/world.jpg': '3',
				'./hello/john.jpg': '4',
				'./hello/jeanne.png': '5',
				'./root.zip': '6',
				'./bar': '7',
			},
			'/tmp'
		);
	});

	test('renders message', async () => {
		const result = prompts.path({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			root: '/tmp/',
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('/tmp/bar');
	});

	test('can cancel', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value if one set', async () => {
		const result = prompts.path({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			root: '/tmp/',
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'b', { name: 'b' });
		mocks.input.emit('keypress', 'a', { name: 'a' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('cannot submit unknown value', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '_', { name: '_' });
		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', '', { name: 'h', ctrl: true });
		mocks.input.emit('keypress', 'b', { name: 'b' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('initialValue sets the value', async () => {
		const result = prompts.path({
			message: 'foo',
			initialValue: '/tmp/bar',
			root: '/tmp/',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('directory mode only allows selecting directories', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			directory: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'f', { name: 'f' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/foo');
	});

	test('directory mode submits initial directory value on enter', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			initialValue: '/tmp',
			directory: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp');
	});

	test('directory mode traverses into child when trailing slash entered', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			initialValue: '/tmp',
			directory: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '/', { name: '/' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/foo');
	});

	test('directory mode can navigate from initial directory to child directory', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			initialValue: '/tmp/',
			directory: true,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'f', { name: 'f' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/foo');
	});

	test('default mode allows selecting files', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'r', { name: 'r' });
		mocks.input.emit('keypress', 'o', { name: 'o' });
		mocks.input.emit('keypress', 'o', { name: 'o' });
		mocks.input.emit('keypress', 't', { name: 't' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/root.zip');
	});

	test('validation errors render and clear', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			validate: (val) => (val !== '/tmp/bar' ? 'should be /tmp/bar' : undefined),
			input: mocks.input,
			output: mocks.output,
		});

		// to match `root.zip`
		mocks.input.emit('keypress', 'r', { name: 'r' });
		mocks.input.emit('keypress', '', { name: 'return' });
		// delete what we had
		mocks.input.emit('keypress', '', { name: 'h', ctrl: true });
		mocks.input.emit('keypress', 'b', { name: 'b' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear (using Error)', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			validate: (val) => (val !== '/tmp/bar' ? new Error('should be /tmp/bar') : undefined),
			input: mocks.input,
			output: mocks.output,
		});

		// to match `root.zip`
		mocks.input.emit('keypress', 'r', { name: 'r' });
		mocks.input.emit('keypress', '', { name: 'return' });
		// delete what we had
		mocks.input.emit('keypress', '', { name: 'h', ctrl: true });
		mocks.input.emit('keypress', 'b', { name: 'b' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
