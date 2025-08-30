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
		const element = <Password message="foo" />;
		const task = element.render({ input, output });

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal(undefined);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders user input', async () => {
		const element = <Password message="foo" />;
		const task = element.render({ input, output });

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('ab');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set custom mask', async () => {
		const element = <Password message="foo" mask="!" />;
		const task = element.render({ input, output });

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('ab');
		expect(output.buffer).toMatchSnapshot();
	});
});
