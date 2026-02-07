import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DateFormatConfig, DateParts } from '../../src/prompts/date.js';
import { default as DatePrompt } from '../../src/prompts/date.js';
import { isCancel } from '../../src/utils/index.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

function buildFormatConfig(
	format: (p: DateParts) => string,
	types: ('year' | 'month' | 'day')[]
): DateFormatConfig {
	const segments = types.map((type) => {
		const len = type === 'year' ? 4 : 2;
		return { type, len };
	});
	return { segments, format };
}

const YYYY_MM_DD = buildFormatConfig(
	(p) => `${p.year}/${p.month}/${p.day}`,
	['year', 'month', 'day']
);
const MM_DD_YYYY = buildFormatConfig(
	(p) => `${p.month}/${p.day}/${p.year}`,
	['month', 'day', 'year']
);
const DD_MM_YYYY = buildFormatConfig(
	(p) => `${p.day}/${p.month}/${p.year}`,
	['day', 'month', 'year']
);

const d = (iso: string) => {
	const [y, m, day] = iso.slice(0, 10).split('-').map(Number);
	return new Date(y, m - 1, day);
};

describe('DatePrompt', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders render() result', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('initial value displays correctly', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('2025/01/15');
		expect(instance.value).toBeInstanceOf(Date);
		expect(instance.value!.toISOString().slice(0, 10)).to.equal('2025-01-15');
	});

	test('left/right navigates between segments', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.cursor).to.equal(0); // year start
		// Move within year (0->1->2->3), then right from end goes to month
		for (let i = 0; i < 4; i++) {
			input.emit('keypress', undefined, { name: 'right' });
		}
		expect(instance.cursor).to.equal(5); // month start
		for (let i = 0; i < 2; i++) {
			input.emit('keypress', undefined, { name: 'right' });
		}
		expect(instance.cursor).to.equal(8); // day start
		input.emit('keypress', undefined, { name: 'left' });
		expect(instance.cursor).to.equal(5); // month start
	});

	test('up/down increments and decrements segment', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		for (let i = 0; i < 4; i++) input.emit('keypress', undefined, { name: 'right' }); // move to month
		input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/02/15');
		input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/01/15');
	});

	test('up/down on one segment leaves other segments blank', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
		});
		instance.prompt();
		expect(instance.userInput).to.equal('____/__/__');
		input.emit('keypress', undefined, { name: 'up' }); // up on year (first segment)
		expect(instance.userInput).to.equal('1000/__/__');
		input.emit('keypress', undefined, { name: 'right' });
		input.emit('keypress', undefined, { name: 'right' });
		input.emit('keypress', undefined, { name: 'right' });
		input.emit('keypress', undefined, { name: 'right' }); // move to month
		input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('1000/01/__');
	});

	test('with minDate/maxDate, up on blank segment starts at min', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			minDate: d('2025-03-10'),
			maxDate: d('2025-11-20'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('____/__/__');
		input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/__/__');
		for (let i = 0; i < 4; i++) input.emit('keypress', undefined, { name: 'right' });
		input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/03/__');
		for (let i = 0; i < 2; i++) input.emit('keypress', undefined, { name: 'right' });
		input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/03/10');
	});

	test('with minDate/maxDate, down on blank segment starts at max', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			minDate: d('2025-03-10'),
			maxDate: d('2025-11-20'),
		});
		instance.prompt();
		input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/__/__');
		for (let i = 0; i < 4; i++) input.emit('keypress', undefined, { name: 'right' });
		input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/11/__');
		for (let i = 0; i < 2; i++) input.emit('keypress', undefined, { name: 'right' });
		input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/11/20');
	});

	test('digit-by-digit editing from left to right', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.cursor).to.equal(0); // year start
		// Type 2,0,2,3 to change 2025 -> 2023 (edit digit by digit)
		input.emit('keypress', '2', { name: undefined, sequence: '2' });
		input.emit('keypress', '0', { name: undefined, sequence: '0' });
		input.emit('keypress', '2', { name: undefined, sequence: '2' });
		input.emit('keypress', '3', { name: undefined, sequence: '3' });
		expect(instance.userInput).to.equal('2023/01/15');
		expect(instance.cursor).to.equal(3); // end of year segment
	});

	test('backspace clears entire segment at any cursor position', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-12-21'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('2025/12/21');
		expect(instance.cursor).to.equal(0); // year start
		// Backspace at first position clears whole year segment
		input.emit('keypress', undefined, { name: 'backspace', sequence: '\x7f' });
		expect(instance.userInput).to.equal('____/12/21');
		expect(instance.cursor).to.equal(0);
	});

	test('backspace clears segment when cursor at first char (2___)', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
		});
		instance.prompt();
		// Type "2" to get "2___"
		input.emit('keypress', '2', { name: undefined, sequence: '2' });
		expect(instance.userInput).to.equal('2___/__/__');
		expect(instance.cursor).to.equal(1); // after "2"
		// Move to first char (position 0)
		input.emit('keypress', undefined, { name: 'left' });
		expect(instance.cursor).to.equal(0);
		// Backspace should clear whole segment - also test char-based detection
		input.emit('keypress', '\x7f', { name: undefined, sequence: '\x7f' });
		expect(instance.userInput).to.equal('____/__/__');
		expect(instance.cursor).to.equal(0);
	});

	test('digit input updates segment and jumps to next when complete', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
		});
		instance.prompt();
		// Type year 2025 - left-to-right, jumps to month when year complete
		for (const c of '2025') {
			input.emit('keypress', c, { name: undefined, sequence: c });
		}
		expect(instance.userInput).to.equal('2025/__/__');
		expect(instance.cursor).to.equal(5); // jumped to month segment start
	});

	test('submit returns ISO string for valid date', async () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-31'),
		});
		const resultPromise = instance.prompt();
		input.emit('keypress', undefined, { name: 'return' });
		const result = await resultPromise;
		expect(result).toBeInstanceOf(Date);
		expect((result as Date).toISOString().slice(0, 10)).to.equal('2025-01-31');
	});

	test('can cancel', async () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-15'),
		});
		const resultPromise = instance.prompt();
		input.emit('keypress', 'escape', { name: 'escape' });
		const result = await resultPromise;
		expect(isCancel(result)).toBe(true);
	});

	test('defaultValue used when invalid date submitted', async () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			defaultValue: d('2025-06-15'),
		});
		const resultPromise = instance.prompt();
		input.emit('keypress', undefined, { name: 'return' });
		const result = await resultPromise;
		expect(result).toBeInstanceOf(Date);
		expect((result as Date).toISOString().slice(0, 10)).to.equal('2025-06-15');
	});

	test('supports MM/DD/YYYY format', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: MM_DD_YYYY,
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('01/15/2025');
	});

	test('rejects invalid month and shows inline error', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-15'), // month is 01
		});
		instance.prompt();
		for (let i = 0; i < 4; i++) input.emit('keypress', undefined, { name: 'right' }); // move to month (cursor at start)
		input.emit('keypress', '3', { name: undefined, sequence: '3' }); // 0→3 gives 31, invalid
		expect(instance.userInput).to.equal('2025/01/15'); // stayed - 31 rejected
		expect(instance.inlineError).to.equal('There are only 12 months in a year');
	});

	test('rejects invalid day and shows inline error', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: YYYY_MM_DD,
			initialValue: d('2025-01-15'), // January has 31 days
		});
		instance.prompt();
		for (let i = 0; i < 6; i++) input.emit('keypress', undefined, { name: 'right' }); // move to day (cursor at start)
		input.emit('keypress', '4', { name: undefined, sequence: '4' }); // 1→4 gives 45, invalid for Jan
		expect(instance.userInput).to.equal('2025/01/15'); // stayed - 45 rejected
		expect(instance.inlineError).to.contain('31 days');
		expect(instance.inlineError).to.contain('January');
	});

	test('supports DD/MM/YYYY format', () => {
		const instance = new DatePrompt({
			input,
			output,
			render: () => 'foo',
			formatConfig: DD_MM_YYYY,
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('15/01/2025');
	});

	describe('segmentValues and segmentCursor', () => {
		test('segmentValues reflects current input', () => {
			const instance = new DatePrompt({
				input,
				output,
				render: () => 'foo',
				formatConfig: YYYY_MM_DD,
				initialValue: d('2025-01-15'),
			});
			instance.prompt();
			const segmentValues = instance.segmentValues;
			expect(segmentValues.year).to.equal('2025');
			expect(segmentValues.month).to.equal('01');
			expect(segmentValues.day).to.equal('15');
		});

		test('segmentCursor tracks cursor position', () => {
			const instance = new DatePrompt({
				input,
				output,
				render: () => 'foo',
				formatConfig: YYYY_MM_DD,
				initialValue: d('2025-01-15'),
			});
			instance.prompt();
			for (let i = 0; i < 4; i++) input.emit('keypress', undefined, { name: 'right' }); // move to month
			const cursor = instance.segmentCursor;
			expect(cursor.segmentIndex).to.equal(1); // month segment
			expect(cursor.positionInSegment).to.equal(0); // start of segment
		});

		test('segmentValues updates on submit', () => {
			const instance = new DatePrompt({
				input,
				output,
				render: () => 'foo',
				formatConfig: YYYY_MM_DD,
				initialValue: d('2025-01-15'),
			});
			instance.prompt();
			input.emit('keypress', undefined, { name: 'return' });
			const segmentValues = instance.segmentValues;
			expect(segmentValues.year).to.equal('2025');
			expect(segmentValues.month).to.equal('01');
			expect(segmentValues.day).to.equal('15');
		});
	});
});
