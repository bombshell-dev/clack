import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from './index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('text (isCI = %s)', (isCI) => {
	let originalCI: string | undefined;
	let output: MockWritable;
	let input: MockReadable;

	beforeAll(() => {
		originalCI = process.env.CI;
		process.env.CI = isCI;
	});

	afterAll(() => {
		process.env.CI = originalCI;
	});

	beforeEach(() => {
		output = new MockWritable();
		input = new MockReadable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders message', async () => {
		const result = prompts.text({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		await result;

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders placeholder if set', async () => {
		const result = prompts.text({
			message: 'foo',
			placeholder: 'bar',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(output.buffer).toMatchSnapshot();

		expect(value).toBe('bar');
	});

	test('<tab> applies placeholder', async () => {
		const result = prompts.text({
			message: 'foo',
			placeholder: 'bar',
			input,
			output,
		});

		input.emit('keypress', '\t', { name: 'tab' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('bar');
	});

	test('can cancel', async () => {
		const result = prompts.text({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value if one set', async () => {
		const result = prompts.text({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.text({
			message: 'foo',
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(output.buffer).toMatchSnapshot();
	});

	test('defaultValue sets the value but does not render', async () => {
		const result = prompts.text({
			message: 'foo',
			defaultValue: 'bar',
			input,
			output,
		});

		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('bar');
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear', async () => {
		const result = prompts.text({
			message: 'foo',
			validate: (val) => (val !== 'xy' ? 'should be xy' : undefined),
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear (using Error)', async () => {
		const result = prompts.text({
			message: 'foo',
			validate: (val) => (val !== 'xy' ? new Error('should be xy') : undefined),
			input,
			output,
		});

		input.emit('keypress', 'x', { name: 'x' });
		input.emit('keypress', '', { name: 'return' });
		input.emit('keypress', 'y', { name: 'y' });
		input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(output.buffer).toMatchSnapshot();
	});
});
