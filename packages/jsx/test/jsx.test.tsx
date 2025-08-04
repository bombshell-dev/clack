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
		const element = jsx(Confirm, {
			message: 'foo?',
		});
		const task = element.render({ input, output });
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
	});

	test('can render JSX', async () => {
		const element = <Confirm message="foo?" />;
		const task = element.render({ input, output });
		input.emit('keypress', '', { name: 'return' });
		const result = await task;
		expect(result).to.equal(true);
	});

	test('unknown elements are null', async () => {
		const element = jsx('unknown-nonsense' as never, {} as never);
		const result = await element.render();
		expect(result).to.equal(null);
	});
});
