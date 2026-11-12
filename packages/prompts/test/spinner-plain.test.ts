import { styleText } from 'node:util';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { S_STEP_CANCEL, S_STEP_ERROR, S_STEP_SUBMIT } from '../src/common.js';
import * as prompts from '../src/index.js';
import { MockWritable } from './test-utils.js';

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching cursor/erase sequences
const CURSOR_OR_ERASE = /\x1b\[\?25[lh]|\x1b\[[0-9]*[GJKA]|<cursor\.|<erase\./;

describe.each([
	{
		label: 'CI=true',
		setup: (output: MockWritable) => {
			process.env.CI = 'true';
			output.isTTY = true;
		},
	},
	{
		label: 'non-TTY',
		setup: (output: MockWritable) => {
			process.env.CI = 'false';
			output.isTTY = false;
		},
	},
])('spinner plain output ($label)', ({ setup }) => {
	let originalCI: string | undefined;
	let output: MockWritable;

	beforeEach(() => {
		originalCI = process.env.CI;
		output = new MockWritable();
		setup(output);
		vi.useFakeTimers();
	});

	afterEach(() => {
		process.env.CI = originalCI;
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	test('prints start and status lines without cursor or spinner frames', () => {
		const result = prompts.spinner({ output });

		result.start('Publishing packages');
		vi.advanceTimersByTime(500);
		result.message('Still publishing');
		vi.advanceTimersByTime(500);
		result.stop('Successfully published');

		const joined = output.buffer.join('');
		expect(joined).not.toMatch(CURSOR_OR_ERASE);
		expect(joined).not.toMatch(/[◒◐◓◑]/);
		expect(output.buffer).toEqual([
			'Publishing packages\n',
			'Still publishing\n',
			`${styleText('green', S_STEP_SUBMIT)}  Successfully published\n`,
		]);
	});

	test('cancel and error use status symbols without TTY junk', () => {
		for (const [end, step, msg] of [
			['cancel', styleText('red', S_STEP_CANCEL), 'Cancelled'] as const,
			['error', styleText('red', S_STEP_ERROR), 'Failed'] as const,
		]) {
			output = new MockWritable();
			setup(output);
			const result = prompts.spinner({ output });
			result.start('Working');
			result[end](msg);
			expect(output.buffer.join('')).not.toMatch(CURSOR_OR_ERASE);
			expect(output.buffer).toEqual(['Working\n', `${step}  ${msg}\n`]);
		}
	});

	test('plainMessageUpdates: false only prints start and end', () => {
		const result = prompts.spinner({ output, plainMessageUpdates: false });

		result.start('Start');
		result.message('Mid');
		result.message('Later');
		result.stop('Done');

		expect(output.buffer).toEqual(['Start\n', `${styleText('green', S_STEP_SUBMIT)}  Done\n`]);
	});

	test('clear is silent', () => {
		const result = prompts.spinner({ output });
		result.start('Loading');
		result.clear();
		expect(output.buffer).toEqual(['Loading\n']);
	});
});

describe('progress plain output (CI=true)', () => {
	let originalCI: string | undefined;
	let output: MockWritable;

	beforeEach(() => {
		originalCI = process.env.CI;
		process.env.CI = 'true';
		output = new MockWritable();
		output.isTTY = true;
		vi.useFakeTimers();
	});

	afterEach(() => {
		process.env.CI = originalCI;
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	test('omits progress bar and cursor codes; advance without message is silent', () => {
		const result = prompts.progress({ output, max: 4, size: 10 });

		result.start('Publishing packages');
		result.advance();
		result.advance();
		result.message('Creating git tags');
		result.advance();
		result.stop('Created git tags.');

		const joined = output.buffer.join('');
		expect(joined).not.toMatch(CURSOR_OR_ERASE);
		expect(joined).not.toMatch(/[━─█=#-]{4,}/);
		expect(joined).not.toMatch(/[◒◐◓◑]/);
		expect(output.buffer).toEqual([
			'Publishing packages\n',
			'Creating git tags\n',
			`${styleText('green', S_STEP_SUBMIT)}  Created git tags.\n`,
		]);
	});
});
