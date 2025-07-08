import { MockReadable, MockWritable } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Option, Select } from '../../src/index.js';

describe('Select', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	test('renders options', async () => {
		const task = (
			<Select message="foo" input={input} output={output}>
				<Option value={'opt0'} />
				<Option value={'opt1'} />
			</Select>
		);

		// wait a tick... sad times
		await new Promise((res) => setTimeout(res, 0));

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('opt0');
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders options with labels', async () => {
		const task = (
			<Select message="foo" input={input} output={output}>
				<Option value={303}>Three o three</Option>
				<Option value={808}>Eight o eight</Option>
			</Select>
		);

		// wait a tick... sad times
		await new Promise((res) => setTimeout(res, 0));

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal(303);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders options with hints', async () => {
		const task = (
			<Select message="foo" input={input} output={output}>
				<Option value={303} hint="hint one">
					Three o three
				</Option>
				<Option value={808} hint="hint two">
					Eight o eight
				</Option>
			</Select>
		);

		// wait a tick... sad times
		await new Promise((res) => setTimeout(res, 0));

		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal(303);
		expect(output.buffer).toMatchSnapshot();
	});
});
