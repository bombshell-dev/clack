import { MockReadable, MockWritable, nextTick } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Confirm, Note } from '../../src/index.js';

describe('Note', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('can render string message', async () => {
		const element = <Note message="foo" />;
		const task = element.render({ output });
		await task;

		expect(output.buffer).toMatchSnapshot();
	});

	test('can render children as message', async () => {
		const element = <Note>a message</Note>;
		const task = element.render({ output });
		await task;

		expect(output.buffer).toMatchSnapshot();
	});

	test('can render complex results as message', async () => {
		const element = (
			<Note>
				<Confirm message="say yes" />
			</Note>
		);
		const task = element.render({ input, output });
		input.emit('keypress', '', { name: 'return' });
		await task;

		expect(output.buffer).toMatchSnapshot();
	});

	test('can render multiple children as message', async () => {
		const element = (
			<Note>
				<Confirm message="say yes" />
				<Confirm message="say yes again" />
			</Note>
		);
		const task = element.render({ input, output });
		input.emit('keypress', '', { name: 'return' });
		await nextTick();
		input.emit('keypress', '', { name: 'return' });
		await task;

		expect(output.buffer).toMatchSnapshot();
	});
});
