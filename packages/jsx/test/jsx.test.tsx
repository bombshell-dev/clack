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
		const result = jsx('confirm', {
			message: 'foo?',
			input,
			output,
		});
		expect(result).to.equal('foo');
	});

	test('can render JSX', () => {
		const result = <Confirm message="foo?" input={input} output={output} />;
		expect(result).to.equal('foo');
	});
});
