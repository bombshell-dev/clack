import colors from 'picocolors';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockWritable } from './test-utils.js';

describe.each(['true', 'false'])('log (isCI = %s)', (isCI) => {
	let originalCI: string | undefined;
	let output: MockWritable;

	beforeAll(() => {
		originalCI = process.env.CI;
		process.env.CI = isCI;
	});

	afterAll(() => {
		process.env.CI = originalCI;
	});

	beforeEach(() => {
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('message', () => {
		test('renders message', () => {
			prompts.log.message('message', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders multiline message', () => {
			prompts.log.message('line 1\nline 2\nline 3', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message from array', () => {
			prompts.log.message(['line 1', 'line 2', 'line 3'], {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message with custom symbols and spacing', () => {
			prompts.log.message('custom\nsymbols', {
				symbol: colors.red('>>'),
				secondarySymbol: colors.yellow('--'),
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message with guide disabled', () => {
			prompts.log.message('standalone message', {
				withGuide: false,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders multiline message with guide disabled', () => {
			prompts.log.message('line 1\nline 2\nline 3', {
				withGuide: false,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders message with custom spacing', () => {
			prompts.log.message('spaced message', {
				spacing: 3,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders empty message correctly', () => {
			prompts.log.message('', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders empty message with guide disabled', () => {
			prompts.log.message('', {
				withGuide: false,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders empty lines correctly', () => {
			prompts.log.message('foo\n\nbar', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});

		test('renders empty lines with guide disabled', () => {
			prompts.log.message('foo\n\nbar', {
				withGuide: false,
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('info', () => {
		test('renders info message', () => {
			prompts.log.info('info message', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('success', () => {
		test('renders success message', () => {
			prompts.log.success('success message', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('step', () => {
		test('renders step message', () => {
			prompts.log.step('step message', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('warn', () => {
		test('renders warn message', () => {
			prompts.log.warn('warn message', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});
	});

	describe('error', () => {
		test('renders error message', () => {
			prompts.log.error('error message', {
				output,
			});

			expect(output.buffer).toMatchSnapshot();
		});
	});
});
