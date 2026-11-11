import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as prompts from '../src/index.js';
import { MockWritable } from './test-utils.js';

describe('progress (accessible)', () => {
	let originalAccessibleEnv: string | undefined;
	let output: MockWritable;

	beforeEach(() => {
		originalAccessibleEnv = process.env.ACCESSIBLE;
		delete process.env.ACCESSIBLE;
		output = new MockWritable();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		if (originalAccessibleEnv === undefined) {
			delete process.env.ACCESSIBLE;
		} else {
			process.env.ACCESSIBLE = originalAccessibleEnv;
		}
	});

	test('announces plain milestone lines instead of drawing the bar', () => {
		const result = prompts.progress({ output, accessible: true, max: 8 });

		result.start('Installing');
		result.advance(1, 'fetching');
		result.advance(1, 'linking');
		vi.advanceTimersByTime(30_000);
		result.advance(2);
		result.advance(4, 'finishing');
		result.stop('Installed');

		expect(output.buffer).toEqual([
			'Installing\n',
			'25%: linking\n',
			'still working: linking\n',
			'50%: linking\n',
			'100%: finishing\n',
			'Installed\n',
		]);
	});

	test('announces only the highest milestone crossed and never repeats one', () => {
		const result = prompts.progress({ output, accessible: true });

		result.start();
		result.advance(80);
		result.message('still going');
		result.advance(-60);
		result.advance(60);
		result.clear();

		expect(output.buffer).toEqual(['75%\n']);
	});

	test('writes nothing when advanced after the bar has ended', () => {
		for (const end of ['stop', 'cancel', 'error', 'clear'] as const) {
			output = new MockWritable();
			const result = prompts.progress({ output, accessible: true, max: 4 });
			result.start('Working');
			result[end]('Ended');
			const written = [...output.buffer];

			result.advance(4);

			expect(output.buffer).toEqual(written);
		}

		output = new MockWritable();
		const controller = new AbortController();
		const aborted = prompts.progress({
			output,
			accessible: true,
			max: 4,
			signal: controller.signal,
		});
		aborted.start('Working');
		controller.abort();
		const written = [...output.buffer];

		aborted.advance(4);

		expect(output.buffer).toEqual(written);
	});

	test('enabled via ACCESSIBLE env var', () => {
		process.env.ACCESSIBLE = '1';
		const result = prompts.progress({ output, max: 4 });

		result.start('Installing...');
		result.advance(1);
		result.clear();

		expect(output.buffer).toEqual(['Installing\n', '25%: Installing\n']);
	});
});
