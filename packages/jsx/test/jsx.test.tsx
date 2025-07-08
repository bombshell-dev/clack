import { MockReadable, MockWritable } from '@clack/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { Confirm, Note, Option, Password, Select, Text, jsx } from '../src/index.js';

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

	describe('Confirm', () => {
		test('can set message', async () => {
			const task = <Confirm message="foo?" input={input} output={output} />;
			input.emit('keypress', '', { name: 'return' });
			const result = await task;
			expect(result).to.equal(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set active text', async () => {
			const task = <Confirm message="foo?" active="DO IT" input={input} output={output} />;
			input.emit('keypress', '', { name: 'return' });
			const result = await task;
			expect(result).to.equal(true);
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set inactive text', async () => {
			const task = <Confirm message="foo?" inactive="DONT DO IT" input={input} output={output} />;
			input.emit('keypress', '', { name: 'return' });
			const result = await task;
			expect(result).to.equal(true);
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('Note', () => {
		test('can render string message', async () => {
			const task = <Note message="foo" output={output} />;
			await task;

			expect(output.buffer).toMatchSnapshot();
		});

		test('can render children as message', async () => {
			const task = <Note output={output}>a message</Note>;
			await task;

			expect(output.buffer).toMatchSnapshot();
		});

		test('can render complex results as message', async () => {
			const task = (
				<Note output={output}>
					<Confirm message="say yes" input={input} output={output} />
				</Note>
			);
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
			);
			input.emit('keypress', '', { name: 'return' });
			input.emit('keypress', '', { name: 'return' });
			await task;

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('Text', () => {
		test('renders text input', async () => {
			const task = <Text message="foo" output={output} input={input} />;

			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal('');
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set placeholder', async () => {
			const task = <Text message="foo" placeholder="bar" output={output} input={input} />;

			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal('');
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set default value', async () => {
			const task = <Text message="foo" defaultValue="bar" output={output} input={input} />;

			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal('bar');
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set initial value', async () => {
			const task = <Text message="foo" initialValue="bar" output={output} input={input} />;

			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal('bar');
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('Password', () => {
		test('renders password input', async () => {
			const task = <Password message="foo" output={output} input={input} />;

			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal(undefined);
			expect(output.buffer).toMatchSnapshot();
		});

		test('renders user input', async () => {
			const task = <Password message="foo" output={output} input={input} />;

			input.emit('keypress', 'a', { name: 'a' });
			input.emit('keypress', 'b', { name: 'b' });
			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal('ab');
			expect(output.buffer).toMatchSnapshot();
		});

		test('can set custom mask', async () => {
			const task = <Password message="foo" mask="!" output={output} input={input} />;

			input.emit('keypress', 'a', { name: 'a' });
			input.emit('keypress', 'b', { name: 'b' });
			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal('ab');
			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('Select', () => {
		test('renders options', async () => {
			const task = (
				<Select message="pick one" input={input} output={output}>
					<Option value={303}>Option One</Option>
					<Option value={808}>Option Two</Option>
				</Select>
			);

			input.emit('keypress', '', { name: 'return' });

			const result = await task;

			expect(result).to.equal(303);
			expect(output.buffer).toMatchSnapshot();
		});
	});
});
