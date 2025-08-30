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
		const element = <Text message="foo" />;
		const task = element.render({ input, output });

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set placeholder', async () => {
		const element = <Text message="foo" placeholder="bar" />;
		const task = element.render({ input, output });

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set default value', async () => {
		const element = <Text message="foo" defaultValue="bar" />;
		const task = element.render({ input, output });

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set initial value', async () => {
		const element = <Text message="foo" initialValue="bar" />;
		const task = element.render({ input, output });

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('bar');
		expect(output.buffer).toMatchSnapshot();
	});
});
