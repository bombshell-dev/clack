import { MockReadable, MockWritable } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Confirm } from '../../src/index.js';

describe('Confirm', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('can set message', async () => {
		const task = (<Confirm message="foo?" input={input} output={output} />)();
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set active text', async () => {
		const task = (<Confirm message="foo?" active="DO IT" input={input} output={output} />)();
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set inactive text', async () => {
		const task = (<Confirm message="foo?" inactive="DONT DO IT" input={input} output={output} />)();
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
		expect(output.buffer).toMatchSnapshot();
	});
});
