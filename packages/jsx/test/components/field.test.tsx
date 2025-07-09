import { MockReadable, MockWritable, nextTick } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Field, Text } from '../../src/index.js';

describe('Field', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('renders and resolves children', async () => {
		const task = (
			<Field name="foo">
				<Text message="enter some text" output={output} input={input} />
			</Field>
		)();

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.deep.equal({
			name: 'foo',
			value: 'ab',
		});
		expect(output.buffer).toMatchSnapshot();
	});

	test('resolves multiple children into array', async () => {
		const task = (
			<Field name="foo">
				<Text message="enter some text" output={output} input={input} />
				<Text message="enter some more text" output={output} input={input} />
			</Field>
		)();

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', '', { name: 'return' });
		await nextTick();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.deep.equal({
			name: 'foo',
			value: ['a', 'b'],
		});
		expect(output.buffer).toMatchSnapshot();
	});
});
