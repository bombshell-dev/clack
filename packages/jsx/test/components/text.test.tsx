import { MockReadable, MockWritable } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Text } from '../../src/index.js';

describe('Text', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('renders text input', async () => {
		const task = <Text message="foo" output={output} input={input} />;

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set placeholder', async () => {
		const task = <Text message="foo" placeholder="bar" output={output} input={input} />;

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set default value', async () => {
		const task = <Text message="foo" defaultValue="bar" output={output} input={input} />;

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set initial value', async () => {
		const task = <Text message="foo" initialValue="bar" output={output} input={input} />;

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('bar');
		expect(output.buffer).toMatchSnapshot();
	});
});
