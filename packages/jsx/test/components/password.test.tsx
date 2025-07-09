import { MockReadable, MockWritable } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Password } from '../../src/index.js';

describe('Password', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('renders password input', async () => {
		const task = (<Password message="foo" output={output} input={input} />)();

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal(undefined);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders user input', async () => {
		const task = (<Password message="foo" output={output} input={input} />)();

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('ab');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set custom mask', async () => {
		const task = (<Password message="foo" mask="!" output={output} input={input} />)();

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('ab');
		expect(output.buffer).toMatchSnapshot();
	});
});
