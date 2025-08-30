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
		const element = <Confirm message="foo?" />;
		const task = element.render({ input, output });
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set active text', async () => {
		const element = <Confirm message="foo?" active="DO IT" input={input} output={output} />;
		const task = element.render({ input, output });
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('can set inactive text', async () => {
		const element = <Confirm message="foo?" inactive="DONT DO IT" />;
		const task = element.render({ input, output });
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
		expect(output.buffer).toMatchSnapshot();
	});
});
