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
		const task = <Note message="foo" output={output} />;
		await task();

		expect(output.buffer).toMatchSnapshot();
	});

	test('can render children as message', async () => {
		const task = <Note output={output}>a message</Note>;
		await task();

		expect(output.buffer).toMatchSnapshot();
	});

	test('can render complex results as message', async () => {
		const task = (
			<Note output={output}>
				<Confirm message="say yes" input={input} output={output} />
			</Note>
		)();
		input.emit('keypress', '', { name: 'return' });
		await task;

		expect(output.buffer).toMatchSnapshot();
	});

	test('can render multiple children as message', async () => {
		const task = (
			<Note output={output}>
				<Confirm message="say yes" input={input} output={output} />
				<Confirm message="say yes again" input={input} output={output} />
			</Note>
		)();
		input.emit('keypress', '', { name: 'return' });
		await nextTick();
		input.emit('keypress', '', { name: 'return' });
		await task;

		expect(output.buffer).toMatchSnapshot();
	});
});
