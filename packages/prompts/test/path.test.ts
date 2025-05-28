import { vol } from 'memfs';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

vi.mock('node:fs');

describe.each(['true', 'false'])('text (isCI = %s)', (isCI) => {
	let originalCI: string | undefined;
	let output: MockWritable;
	let input: MockReadable;

	beforeAll(() => {
		originalCI = process.env.CI;
		process.env.CI = isCI;
	});

	afterAll(() => {
		process.env.CI = originalCI;
	});

	beforeEach(() => {
		output = new MockWritable();
		input = new MockReadable();
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

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders message', async () => {
		const result = prompts.path({
			message: 'foo',
			input,
			output,
			root: '/tmp/',
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();
		expect(value).toBe('/tmp/bar');
	});

	test('can cancel', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value if one set', async () => {
		const result = prompts.path({
			message: 'foo',
			input,
			output,
			root: '/tmp/',
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			input,
			output,
		});

		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('cannot submit unknown value', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			input,
			output,
		});

		input.emit('keypress', '_', { name: '_' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', '', { name: 'h', ctrl: true });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('initialValue sets the value', async () => {
		const result = prompts.path({
			message: 'foo',
			initialValue: '/tmp/bar',
			root: '/tmp/',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			validate: (val) => (val !== '/tmp/bar' ? 'should be /tmp/bar' : undefined),
			input,
			output,
		});

		// to match `root.zip`
		input.emit('keypress', 'r', { name: 'r' });
		input.emit('keypress', '', { name: 'return' });
		// delete what we had
		input.emit('keypress', '', { name: 'h', ctrl: true });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear (using Error)', async () => {
		const result = prompts.path({
			message: 'foo',
			root: '/tmp/',
			validate: (val) => (val !== '/tmp/bar' ? new Error('should be /tmp/bar') : undefined),
			input,
			output,
		});

		// to match `root.zip`
		input.emit('keypress', 'r', { name: 'r' });
		input.emit('keypress', '', { name: 'return' });
		// delete what we had
		input.emit('keypress', '', { name: 'h', ctrl: true });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('/tmp/bar');
		expect(output.buffer).toMatchSnapshot();
	});
});
