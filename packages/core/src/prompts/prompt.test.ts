import { cursor } from 'sisteransi';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { default as Prompt } from './prompt.js';
import { isCancel } from '../utils/index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe('Prompt', () => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('renders render() result', () => {
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});
		// leave the promise hanging since we don't want to submit in this test
		instance.prompt();
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('submits on return key', async () => {
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal(undefined);
		expect(isCancel(result)).to.equal(false);
		expect(instance.state).to.equal('submit');
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo', '\n', cursor.show]);
	});

	test('cancels on ctrl-c', async () => {
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', '\x03', { name: 'c' });
		const result = await resultPromise;
		expect(isCancel(result)).to.equal(true);
		expect(instance.state).to.equal('cancel');
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo', '\n', cursor.show]);
	});

	test('does not write initialValue to value', () => {
		const eventSpy = vi.fn();
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			initialValue: 'bananas',
		});
		instance.on('value', eventSpy);
		instance.prompt();
		expect(instance.value).to.equal(undefined);
		expect(eventSpy).not.toHaveBeenCalled();
	});

	test('re-renders on resize', () => {
		const renderFn = vi.fn().mockImplementation(() => 'foo');
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: renderFn,
		});
		instance.prompt();

		expect(renderFn).toHaveBeenCalledTimes(1);

		mocks.output.emit('resize');

		expect(renderFn).toHaveBeenCalledTimes(2);
	});

	test('state is active after first render', async () => {
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});

		expect(instance.state).to.equal('initial');

		instance.prompt();

		expect(instance.state).to.equal('active');
	});

	test('emits truthy confirm on y press', () => {
		const eventFn = vi.fn();
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});

		instance.on('confirm', eventFn);

		instance.prompt();

		mocks.input.emit('keypress', 'y', { name: 'y' });

		expect(eventFn).toBeCalledWith(true);
	});

	test('emits falsey confirm on n press', () => {
		const eventFn = vi.fn();
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});

		instance.on('confirm', eventFn);

		instance.prompt();

		mocks.input.emit('keypress', 'n', { name: 'n' });

		expect(eventFn).toBeCalledWith(false);
	});

	test('emits key event for unknown chars', () => {
		const eventSpy = vi.fn();
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});

		instance.on('key', eventSpy);

		instance.prompt();

		mocks.input.emit('keypress', 'z', { name: 'z' });

		expect(eventSpy).toBeCalledWith('z', { name: 'z' });
	});

	test('emits cursor events for movement keys', () => {
		const keys = ['up', 'down', 'left', 'right'];
		const eventSpy = vi.fn();
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
		});

		instance.on('cursor', eventSpy);

		instance.prompt();

		for (const key of keys) {
			mocks.input.emit('keypress', key, { name: key });
			expect(eventSpy).toBeCalledWith(key);
		}
	});

	test('emits cursor events for movement key aliases when not tracking', () => {
		const keys = [
			['k', 'up'],
			['j', 'down'],
			['h', 'left'],
			['l', 'right'],
		];
		const eventSpy = vi.fn();
		const instance = new Prompt(
			{
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
			},
			false
		);

		instance.on('cursor', eventSpy);

		instance.prompt();

		for (const [alias, key] of keys) {
			mocks.input.emit('keypress', alias, { name: alias });
			expect(eventSpy).toBeCalledWith(key);
		}
	});

	test('aborts on abort signal', () => {
		const abortController = new AbortController();

		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			signal: abortController.signal,
		});

		instance.prompt();

		expect(instance.state).to.equal('active');

		abortController.abort();

		expect(instance.state).to.equal('cancel');
	});

	test('returns immediately if signal is already aborted', () => {
		const abortController = new AbortController();
		abortController.abort();

		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			signal: abortController.signal,
		});
		instance.prompt();

		expect(instance.state).to.equal('cancel');
	});

	test('accepts invalid initial value', () => {
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			initialValue: 'invalid',
			validate: (value) => (value === 'valid' ? undefined : 'must be valid'),
		});
		instance.prompt();

		expect(instance.state).to.equal('active');
		expect(instance.error).to.equal('');
	});

	test('validates value on return', () => {
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			validate: (value) => (value === 'valid' ? undefined : 'must be valid'),
		});
		instance.prompt();

		instance.value = 'invalid';

		mocks.input.emit('keypress', '', { name: 'return' });

		expect(instance.state).to.equal('error');
		expect(instance.error).to.equal('must be valid');
	});

	test('validates value with Error object', () => {
		const instance = new Prompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			validate: (value) => (value === 'valid' ? undefined : new Error('must be valid')),
		});
		instance.prompt();

		instance.value = 'invalid';
		mocks.input.emit('keypress', '', { name: 'return' });

		expect(instance.state).to.equal('error');
		expect(instance.error).to.equal('must be valid');
	});

	test('validates value with regex validation', () => {
		const instance = new Prompt<string>({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			validate: (value) => (/^[A-Z]+$/.test(value ?? '') ? undefined : 'Invalid value'),
		});
		instance.prompt();

		instance.value = 'Invalid Value $$$';
		mocks.input.emit('keypress', '', { name: 'return' });

		expect(instance.state).to.equal('error');
		expect(instance.error).to.equal('Invalid value');
	});

	test('accepts valid value with regex validation', () => {
		const instance = new Prompt<string>({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			validate: (value) => (/^[A-Z]+$/.test(value ?? '') ? undefined : 'Invalid value'),
		});
		instance.prompt();

		instance.value = 'VALID';
		mocks.input.emit('keypress', '', { name: 'return' });

		expect(instance.state).to.equal('submit');
		expect(instance.error).to.equal('');
	});
});
