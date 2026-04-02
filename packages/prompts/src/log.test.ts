import { styleText } from 'node:util';
import { beforeEach, describe, expect, test } from 'vitest';
import * as prompts from './index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

describe.each(['true', 'false'])('log (isCI = %s)', (isCI) => {
	let mocks: Mocks<{ output: true }>;

	beforeEach(() => {
		mocks = createMocks({ output: true, env: { CI: isCI } });
	});

	describe('message', () => {
		test('renders message', () => {
			prompts.log.message('message', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders multiline message', () => {
			prompts.log.message('line 1\nline 2\nline 3', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders message from array', () => {
			prompts.log.message(['line 1', 'line 2', 'line 3'], {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders message with custom symbols and spacing', () => {
			prompts.log.message('custom\nsymbols', {
				symbol: styleText('red', '>>'),
				secondarySymbol: styleText('yellow', '--'),
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders message with guide disabled', () => {
			prompts.log.message('standalone message', {
				withGuide: false,
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders multiline message with guide disabled', () => {
			prompts.log.message('line 1\nline 2\nline 3', {
				withGuide: false,
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders message with custom spacing', () => {
			prompts.log.message('spaced message', {
				spacing: 3,
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders empty message correctly', () => {
			prompts.log.message('', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders empty message with guide disabled', () => {
			prompts.log.message('', {
				withGuide: false,
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders empty lines correctly', () => {
			prompts.log.message('foo\n\nbar', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});

		test('renders empty lines with guide disabled', () => {
			prompts.log.message('foo\n\nbar', {
				withGuide: false,
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('info', () => {
		test('renders info message', () => {
			prompts.log.info('info message', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('success', () => {
		test('renders success message', () => {
			prompts.log.success('success message', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('step', () => {
		test('renders step message', () => {
			prompts.log.step('step message', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('warn', () => {
		test('renders warn message', () => {
			prompts.log.warn('warn message', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});

	describe('error', () => {
		test('renders error message', () => {
			prompts.log.error('error message', {
				output: mocks.output,
			});

			expect(mocks.output.buffer).toMatchSnapshot();
		});
	});
});
