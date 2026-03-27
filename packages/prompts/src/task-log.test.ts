import { beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('taskLog (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true, env: { CI: isCI } });
		mocks.output.isTTY = isCI === 'false';
	});

	test('writes message header', () => {
		prompts.taskLog({
			input: mocks.input,
			output: mocks.output,
			title: 'foo',
		});

		expect(mocks.output.buffer).toMatchSnapshot();
	});

	describe('message', () => {
		test('can write line by line', () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('can write multiple lines', () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0\nline 1');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('enforces limit if set', () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
				limit: 2,
			});

			log.message('line 0');
			log.message('line 1');
			log.message('line 2');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('raw = true appends message text until newline', async () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0', { raw: true });
			log.message('still line 0', { raw: true });
			log.message('\nline 1', { raw: true });

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('raw = true works when mixed with non-raw messages', async () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0', { raw: true });
			log.message('still line 0', { raw: true });
			log.message('line 1');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('raw = true works when started with non-raw messages', async () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1', { raw: true });
			log.message('still line 1', { raw: true });

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('prints empty lines', async () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 1');
			log.message('');
			log.message('line 3');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('destructive ansi codes are stripped', async () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 1');
			log.message('line 2\x1b[2K bad ansi!');
			log.message('line 3');

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('error', () => {
		test('renders output with message', () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.error('some error!');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('clears output if showLog = false', () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.error('some error!', { showLog: false });

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('success', () => {
		test('clears output and renders message', () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.success('success!');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders output if showLog = true', () => {
			const log = prompts.taskLog({
				input: mocks.input,
				output: mocks.output,
				title: 'foo',
			});

			log.message('line 0');
			log.message('line 1');

			log.success('success!', { showLog: true });

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('retainLog', () => {
		describe.each(['error', 'success'] as const)('%s', (method) => {
			test('retainLog = true outputs full log', () => {
				const log = prompts.taskLog({
					input: mocks.input,
					output: mocks.output,
					title: 'foo',
					retainLog: true,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(mocks.output.buffer).toMatchSnapshot();
			});

			test('retainLog = true outputs full log with limit', () => {
				const log = prompts.taskLog({
					input: mocks.input,
					output: mocks.output,
					title: 'foo',
					retainLog: true,
					limit: 2,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(mocks.output.buffer).toMatchSnapshot();
			});

			test('retainLog = false outputs full log without limit', () => {
				const log = prompts.taskLog({
					input: mocks.input,
					output: mocks.output,
					title: 'foo',
					retainLog: false,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(mocks.output.buffer).toMatchSnapshot();
			});

			test('retainLog = false outputs limited log with limit', () => {
				const log = prompts.taskLog({
					input: mocks.input,
					output: mocks.output,
					title: 'foo',
					retainLog: false,
					limit: 2,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(mocks.output.buffer).toMatchSnapshot();
			});

			test('outputs limited log with limit by default', () => {
				const log = prompts.taskLog({
					input: mocks.input,
					output: mocks.output,
					title: 'foo',
					limit: 2,
				});

				for (let i = 0; i < 4; i++) {
					log.message(`line ${i}`);
				}

				log[method]('woo!', { showLog: true });

				expect(mocks.output.buffer).toMatchSnapshot();
			});
		});
	});

	describe('group', () => {
		test('can render multiple groups of equal size', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group0 = log.group('Group 0');
			const group1 = log.group('Group 1');

			for (let i = 0; i < 5; i++) {
				group0.message(`Group 0 line ${i}`);
				group1.message(`Group 1 line ${i}`);
			}

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('can render multiple groups of different sizes', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group0 = log.group('Group 0');
			const group1 = log.group('Group 1');

			for (let i = 0; i < 3; i++) {
				group0.message(`Group 0 line ${i}`);
			}
			for (let i = 0; i < 5; i++) {
				group1.message(`Group 1 line ${i}`);
			}

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders success state', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group = log.group('Group 0');
			group.message('Group 0 line 0');
			group.success('Group success!');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders error state', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group = log.group('Group 0');
			group.message('Group 0 line 0');
			group.error('Group error!');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('applies limit per group', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
				limit: 2,
			});
			const group0 = log.group('Group 0');
			const group1 = log.group('Group 1');

			for (let i = 0; i < 5; i++) {
				group0.message(`Group 0 line ${i}`);
				group1.message(`Group 1 line ${i}`);
			}

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders group success state', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group = log.group('Group 0');
			group.message('Group 0 line 0');
			group.success('Group success!');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders group error state', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group = log.group('Group 0');
			group.message('Group 0 line 0');
			group.error('Group error!');

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('showLog shows all groups in order', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group0 = log.group('Group 0');
			const group1 = log.group('Group 1');

			for (let i = 0; i < 3; i++) {
				group0.message(`Group 0 line ${i}`);
			}
			for (let i = 0; i < 5; i++) {
				group1.message(`Group 1 line ${i}`);
			}

			group0.success('Group 0 success!');
			group1.error('Group 1 error!');

			log.error('overall error', { showLog: true });

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('handles empty groups', async () => {
			const log = prompts.taskLog({
				title: 'Some log',
				input: mocks.input,
				output: mocks.output,
			});
			const group = log.group('Group 0');

			group.success('Group success!');

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});
});
