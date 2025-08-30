import { MockReadable, MockWritable, nextTick } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Field, Form, Text } from '../../src/index.js';

describe('Form', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('renders and resolves object', async () => {
		const element = (
			<Form>
				<Field name="foo">
					<Text message="enter some text" />
				</Field>
			</Form>
		);
		const task = element.render({ input, output });

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.deep.equal({
			foo: 'ab',
		});
		expect(output.buffer).toMatchSnapshot();
	});
	test('renders and resolves multiple fields', async () => {
		const element = (
			<Form>
				<Field name="foo">
					<Text message="enter some text" />
				</Field>
				<Field name="bar">
					<Text message="enter some other text" />
				</Field>
			</Form>
		);
		const task = element.render({ input, output });

		input.emit('keypress', 'a', { name: 'a' });
		input.emit('keypress', '', { name: 'return' });
		await nextTick();
		input.emit('keypress', 'b', { name: 'b' });
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.deep.equal({
			foo: 'a',
			bar: 'b',
		});
		expect(output.buffer).toMatchSnapshot();
	});
});
