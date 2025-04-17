import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockReadable, MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('taskLog (isCI = %s)', (isCI) => {
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

	test('writes message header', () => {
		prompts.taskLog({
			input,
			output,
			title: 'foo',
		});

		expect(output.buffer).toMatchSnapshot();
	});

	describe('message', () => {
		test('can write line by line', () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			expect(output.buffer).toMatchSnapshot();
		});

		test('can write multiple lines', () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0\nline 1');

			expect(output.buffer).toMatchSnapshot();
		});

		test('enforces limit if set', () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
				limit: 2,
			});

			log.message('line 0');
			log.message('line 1');
			log.message('line 2');

			expect(output.buffer).toMatchSnapshot();
		});

		test('raw = true appends message text until newline', async () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0', { raw: true });
			log.message('still line 0', { raw: true });
			log.message('\nline 1', { raw: true });

			expect(output.buffer).toMatchSnapshot();
		});

		test('raw = true works when mixed with non-raw messages', async () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0', { raw: true });
			log.message('still line 0', { raw: true });
			log.message('line 1');

			expect(output.buffer).toMatchSnapshot();
		});

		test('raw = true works when started with non-raw messages', async () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1', { raw: true });
			log.message('still line 1', { raw: true });

			expect(output.buffer).toMatchSnapshot();
		});

		test('prints empty lines', async () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('');
			log.message('line 1');
			log.message('');
			log.message('line 3');

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('error', () => {
		test('renders output with message', () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.error('some error!');

			expect(output.buffer).toMatchSnapshot();
		});

		test('clears output if showLog = false', () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.error('some error!', { showLog: false });

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('success', () => {
		test('clears output and renders message', () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.success('success!');

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders output if showLog = true', () => {
			const log = prompts.taskLog({
				input,
				output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.success('success!', { showLog: true });

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('retainLog', () => {
		describe.each(['error', 'success'] as const)('%s', (method) => {
			test('retainLog = true outputs full log', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
					retainLog: true,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(output.buffer).toMatchSnapshot();
			});

			test('retainLog = true outputs full log with limit', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
					retainLog: true,
					limit: 2,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(output.buffer).toMatchSnapshot();
			});

			test('retainLog = false outputs full log without limit', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
					retainLog: false,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(output.buffer).toMatchSnapshot();
			});

			test('retainLog = false outputs limited log with limit', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
					retainLog: false,
					limit: 2,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(output.buffer).toMatchSnapshot();
			});

			test('outputs limited log with limit by default', () => {
				const log = prompts.taskLog({
					input,
					output,
					title: 'foo',
					limit: 2,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(output.buffer).toMatchSnapshot();
			});
		});
	});
});
