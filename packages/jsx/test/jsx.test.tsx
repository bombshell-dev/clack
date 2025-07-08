import { MockReadable, MockWritable } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Confirm, jsx } from '../src/index.js';

describe('jsx', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('can render', async () => {
		const task = jsx(Confirm, {
			message: 'foo?',
			input,
			output,
		});
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
	});

	test('can render JSX', async () => {
		const task = <Confirm message="foo?" input={input} output={output} />;
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
	});

	test('unknown elements are null', async () => {
		const task = jsx('unknown-nonsense' as never, {} as never);
		const result = await task;
		expect(result).to.equal(null);
	});
});
