import { styleText } from 'node:util';
import { describe, expect, test } from 'vitest';
import { formatInstructionFooter, S_BAR, S_BAR_END } from '../src/index.js';
import { MockWritable } from './test-utils.js';

describe('formatInstructionFooter', () => {
	test('accepts the two-argument form', () => {
		expect(formatInstructionFooter(['↑/↓ navigate', 'Enter confirm'], true)).toEqual([
			`${styleText('cyan', S_BAR)}  ↑/↓ navigate • Enter confirm`,
			styleText('cyan', S_BAR_END),
		]);
	});

	test('omits the guide lines without a guide', () => {
		expect(formatInstructionFooter(['Enter confirm'], false)).toEqual(['Enter confirm']);
	});

	test('wraps to the width of the given output', () => {
		const output = new MockWritable();
		output.columns = 20;
		const lines = formatInstructionFooter(['↑/↓ navigate', 'Enter confirm'], false, output);
		expect(lines.length).toBeGreaterThan(1);
		for (const line of lines) expect(line.trimEnd().length).toBeLessThanOrEqual(20);
		expect(lines.join('')).toBe('↑/↓ navigate • Enter confirm');
	});
});
