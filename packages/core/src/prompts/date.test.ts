import { cursor } from 'sisteransi';
import { beforeEach, describe, expect, test } from 'vitest';
import { default as DatePrompt } from './date.js';
import { isCancel } from '../utils/index.js';
import { createMocks, type Mocks } from '@bomb.sh/tools/test-utils';

const d = (iso: string) => {
	const [y, m, day] = iso.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, day));
};

describe('DatePrompt', () => {
	let mocks: Mocks<{ input: true; output: true }>;

	beforeEach(() => {
		mocks = createMocks({ input: true, output: true });
	});

	test('renders render() result', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
		});
		instance.prompt();
		expect(mocks.output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('initial value displays correctly', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('2025/01/15');
		expect(instance.value).toBeInstanceOf(Date);
		expect(instance.value!.toISOString().slice(0, 10)).to.equal('2025-01-15');
	});

	test('left/right navigates between segments', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 0, positionInSegment: 0 });
		mocks.input.emit('keypress', undefined, { name: 'right' });
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 1, positionInSegment: 0 });
		mocks.input.emit('keypress', undefined, { name: 'right' });
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 2, positionInSegment: 0 });
		mocks.input.emit('keypress', undefined, { name: 'left' });
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 1, positionInSegment: 0 });
	});

	test('up/down increments and decrements segment', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		mocks.input.emit('keypress', undefined, { name: 'right' }); // move to month
		mocks.input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/02/15');
		mocks.input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/01/15');
	});

	test('up/down on one segment leaves other segments blank', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
		});
		instance.prompt();
		expect(instance.userInput).to.equal('____/__/__');
		mocks.input.emit('keypress', undefined, { name: 'up' }); // up on year (first segment)
		expect(instance.userInput).to.equal('0001/__/__');
		mocks.input.emit('keypress', undefined, { name: 'right' }); // move to month
		mocks.input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('0001/01/__');
	});

	test('with minDate/maxDate, up on blank segment starts at min', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			minDate: d('2025-03-10'),
			maxDate: d('2025-11-20'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('____/__/__');
		mocks.input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/__/__');
		mocks.input.emit('keypress', undefined, { name: 'right' });
		mocks.input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/03/__');
		mocks.input.emit('keypress', undefined, { name: 'right' });
		mocks.input.emit('keypress', undefined, { name: 'up' });
		expect(instance.userInput).to.equal('2025/03/10');
	});

	test('with minDate/maxDate, down on blank segment starts at max', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			minDate: d('2025-03-10'),
			maxDate: d('2025-11-20'),
		});
		instance.prompt();
		mocks.input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/__/__');
		mocks.input.emit('keypress', undefined, { name: 'right' });
		mocks.input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/11/__');
		mocks.input.emit('keypress', undefined, { name: 'right' });
		mocks.input.emit('keypress', undefined, { name: 'down' });
		expect(instance.userInput).to.equal('2025/11/20');
	});

	test('digit-by-digit editing from left to right', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 0, positionInSegment: 0 });
		// Type 2,0,2,3 to change year to 2023 (right-to-left fill)
		mocks.input.emit('keypress', '2', { name: undefined, sequence: '2' });
		expect(instance.userInput).to.equal('___2/01/15');
		mocks.input.emit('keypress', '0', { name: undefined, sequence: '0' });
		expect(instance.userInput).to.equal('__20/01/15');
		mocks.input.emit('keypress', '2', { name: undefined, sequence: '2' });
		expect(instance.userInput).to.equal('_202/01/15');
		mocks.input.emit('keypress', '3', { name: undefined, sequence: '3' });
		expect(instance.userInput).to.equal('2023/01/15');
	});

	test('backspace clears entire segment at any cursor position', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			initialValue: d('2025-12-21'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('2025/12/21');
		mocks.input.emit('keypress', undefined, { name: 'backspace', sequence: '\x7f' });
		expect(instance.userInput).to.equal('____/12/21');
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 0, positionInSegment: 0 });
	});

	test('backspace clears segment when cursor at first char (2___)', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
		});
		instance.prompt();
		mocks.input.emit('keypress', '2', { name: undefined, sequence: '2' });
		expect(instance.userInput).to.equal('___2/__/__');
		mocks.input.emit('keypress', '\x7f', { name: undefined, sequence: '\x7f' });
		expect(instance.userInput).to.equal('____/__/__');
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 0, positionInSegment: 0 });
	});

	test('digit input updates segment and jumps to next when complete', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
		});
		instance.prompt();
		for (const c of '2025') {
			mocks.input.emit('keypress', c, { name: undefined, sequence: c });
		}
		expect(instance.userInput).to.equal('2025/__/__');
		expect(instance.segmentCursor).to.deep.equal({ segmentIndex: 1, positionInSegment: 0 });
	});

	test('submit returns Date for valid date', async () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			initialValue: d('2025-01-31'),
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', undefined, { name: 'return' });
		const result = await resultPromise;
		expect(result).toBeInstanceOf(Date);
		expect((result as Date).toISOString().slice(0, 10)).to.equal('2025-01-31');
	});

	test('can cancel', async () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			initialValue: d('2025-01-15'),
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', 'escape', { name: 'escape' });
		const result = await resultPromise;
		expect(isCancel(result)).toBe(true);
	});

	test('defaultValue used when invalid date submitted', async () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
			defaultValue: d('2025-06-15'),
		});
		const resultPromise = instance.prompt();
		mocks.input.emit('keypress', undefined, { name: 'return' });
		const result = await resultPromise;
		expect(result).toBeInstanceOf(Date);
		expect((result as Date).toISOString().slice(0, 10)).to.equal('2025-06-15');
	});

	test('supports MDY format', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'MDY',
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('01/15/2025');
	});

	test('supports DMY format', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'DMY',
			initialValue: d('2025-01-15'),
		});
		instance.prompt();
		expect(instance.userInput).to.equal('15/01/2025');
	});

	test('rejects invalid month via pending tens digit', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
		});
		instance.prompt();
		// Navigate to month
		mocks.input.emit('keypress', undefined, { name: 'right' });
		// Type '1' → '01' with pending tens digit (since 1 <= 1)
		mocks.input.emit('keypress', '1', { name: undefined, sequence: '1' });
		expect(instance.segmentValues.month).to.equal('01');
		// Type '3' → tries '13' which is > 12 → inline error
		mocks.input.emit('keypress', '3', { name: undefined, sequence: '3' });
		expect(instance.inlineError).to.equal('There are only 12 months in a year');
	});

	test('rejects invalid day via pending tens digit', () => {
		const instance = new DatePrompt({
			input: mocks.input,
			output: mocks.output,
			render: () => 'foo',
			format: 'YMD',
		});
		instance.prompt();
		// Navigate to day
		mocks.input.emit('keypress', undefined, { name: 'right' });
		mocks.input.emit('keypress', undefined, { name: 'right' });
		// Type '2' → '02' with pending (2 <= 2)
		mocks.input.emit('keypress', '2', { name: undefined, sequence: '2' });
		mocks.input.emit('keypress', '0', { name: undefined, sequence: '0' });
		expect(instance.inlineError).to.equal('');
	});

	describe('segmentValues and segmentCursor', () => {
		test('segmentValues reflects current input', () => {
			const instance = new DatePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				format: 'YMD',
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
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				format: 'YMD',
				initialValue: d('2025-01-15'),
			});
			instance.prompt();
			mocks.input.emit('keypress', undefined, { name: 'right' }); // move to month
			const cursor = instance.segmentCursor;
			expect(cursor.segmentIndex).to.equal(1);
			expect(cursor.positionInSegment).to.equal(0);
		});

		test('segmentValues updates on submit', () => {
			const instance = new DatePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				format: 'YMD',
				initialValue: d('2025-01-15'),
			});
			instance.prompt();
			mocks.input.emit('keypress', undefined, { name: 'return' });
			const segmentValues = instance.segmentValues;
			expect(segmentValues.year).to.equal('2025');
			expect(segmentValues.month).to.equal('01');
			expect(segmentValues.day).to.equal('15');
		});
	});

	describe('formattedValue and segments', () => {
		test('formattedValue returns formatted string', () => {
			const instance = new DatePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				format: 'MDY',
				initialValue: d('2025-03-15'),
			});
			instance.prompt();
			expect(instance.formattedValue).to.equal('03/15/2025');
		});

		test('segments exposes segment config', () => {
			const instance = new DatePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				format: 'DMY',
			});
			instance.prompt();
			expect(instance.segments).to.deep.equal([
				{ type: 'day', len: 2 },
				{ type: 'month', len: 2 },
				{ type: 'year', len: 4 },
			]);
		});

		test('separator defaults to / for explicit format', () => {
			const instance = new DatePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				format: 'YMD',
			});
			instance.prompt();
			expect(instance.separator).to.equal('/');
		});
	});

	describe('locale detection', () => {
		test('locale auto-detects format from Intl', () => {
			const instance = new DatePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				locale: 'en-US',
				initialValue: d('2025-03-15'),
			});
			instance.prompt();
			// en-US is MDY
			expect(instance.segments[0].type).to.equal('month');
			expect(instance.segments[1].type).to.equal('day');
			expect(instance.segments[2].type).to.equal('year');
		});

		test('explicit format overrides locale', () => {
			const instance = new DatePrompt({
				input: mocks.input,
				output: mocks.output,
				render: () => 'foo',
				format: 'YMD',
				locale: 'en-US', // would be MDY, but format takes precedence
				initialValue: d('2025-03-15'),
			});
			instance.prompt();
			expect(instance.segments[0].type).to.equal('year');
		});
	});
});
