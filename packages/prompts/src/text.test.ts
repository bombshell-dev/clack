import { updateSettings } from '@clack/core';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';

describe.each(['true', 'false'])('text (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
	});

	afterEach(() => {
		updateSettings({ withGuide: true });
	});

	test('renders message', async () => {
		const result = prompts.text({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders placeholder if set', async () => {
		const result = prompts.text({
			message: 'foo',
			placeholder: 'bar',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(mocks.output.buffer).toMatchSnapshot();
		expect(value).toBe('');
	});

	test('can cancel', async () => {
		const result = prompts.text({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'escape', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders cancelled value if one set', async () => {
		const result = prompts.text({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'escape' });

		const value = await result;

		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('renders submitted value', async () => {
		const result = prompts.text({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('defaultValue sets the value but does not render', async () => {
		const result = prompts.text({
			message: 'foo',
			defaultValue: 'bar',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('bar');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear', async () => {
		const result = prompts.text({
			message: 'foo',
			validate: (val) => (val !== 'xy' ? 'should be xy' : undefined),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('validation errors render and clear (using Error)', async () => {
		const result = prompts.text({
			message: 'foo',
			validate: (val) => (val !== 'xy' ? new Error('should be xy') : undefined),
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', 'x', { name: 'x' });
		mocks.input.emit('keypress', '', { name: 'return' });
		mocks.input.emit('keypress', 'y', { name: 'y' });
		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('xy');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('placeholder is not used as value when pressing enter', async () => {
		const result = prompts.text({
			message: 'foo',
			placeholder: '  (hit Enter to use default)',
			defaultValue: 'default-value',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('default-value');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('empty string when no value and no default', async () => {
		const result = prompts.text({
			message: 'foo',
			placeholder: '  (hit Enter to use default)',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		const value = await result;

		expect(value).toBe('');
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('can be aborted by a signal', async () => {
		const controller = new AbortController();
		const result = prompts.text({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
			signal: controller.signal,
		});

		controller.abort();
		const value = await result;
		expect(prompts.isCancel(value)).toBe(true);
		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('withGuide: false removes guide', async () => {
		const result = prompts.text({
			message: 'foo',
			withGuide: false,
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	test('global withGuide: false removes guide', async () => {
		updateSettings({ withGuide: false });

		const result = prompts.text({
			message: 'foo',
			input: mocks.input,
			output: mocks.output,
		});

		mocks.input.emit('keypress', '', { name: 'return' });

		await result;

		expect(mocks.output.buffer).toMatchSnapshot();
	});
});
