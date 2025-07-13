import { MockReadable, MockWritable, nextTick } from '@clack/test-utils';
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
		const element = (
			<Select message="foo">
				<Option value={'opt0'} />
				<Option value={'opt1'} />
			</Select>
		);
		const task = element.render({ input, output });

		await nextTick();
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal('opt0');
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders options with labels', async () => {
		const element = (
			<Select message="foo">
				<Option value={303}>Three o three</Option>
				<Option value={808}>Eight o eight</Option>
			</Select>
		);
		const task = element.render({ input, output });

		await nextTick();
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal(303);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders options with hints', async () => {
		const element = (
			<Select message="foo">
				<Option value={303} hint="hint one">
					Three o three
				</Option>
				<Option value={808} hint="hint two">
					Eight o eight
				</Option>
			</Select>
		);
		const task = element.render({ input, output });

		await nextTick();
		input.emit('keypress', '', { name: 'return' });

		const result = await task;

		expect(result).to.equal(303);
		expect(output.buffer).toMatchSnapshot();
	});
});
