import color from 'picocolors';
import { beforeEach, describe, expect, test } from 'vitest';
import { type LimitOptionsParams, limitOptions } from '../src/index.js';
import { MockWritable } from './test-utils.js';

describe('limitOptions', () => {
	let output: MockWritable;
	let options: LimitOptionsParams<{ value: string }>;

	beforeEach(() => {
		output = new MockWritable();
		options = {
			output,
			options: [],
			maxItems: undefined,
			cursor: 0,
			style: (option) => option.value,
			columnPadding: undefined,
			rowPadding: undefined,
		};
	});

	test('returns all items if they fit', async () => {
		options.options = [{ value: 'Item 1' }, { value: 'Item 2' }, { value: 'Item 3' }];
		options.maxItems = 5;
		const result = limitOptions(options);
		expect(result).toEqual(['Item 1', 'Item 2', 'Item 3']);
	});

	test('clamps to 5 rows minimum', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
		];
		options.maxItems = 3;
		const result = limitOptions(options);
		expect(result).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', color.dim('...')]);
	});

	test('returns sliding window when cursor moves down', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{ value: 'Item 8' },
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		output.rows = 20;
		options.maxItems = 5;
		options.cursor = 6;
		const result = limitOptions(options);
		expect(result).toEqual([color.dim('...'), 'Item 6', 'Item 7', 'Item 8', color.dim('...')]);
	});

	test('returns sliding window near end of list', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{ value: 'Item 8' },
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		options.maxItems = 5;
		options.cursor = 8;
		const result = limitOptions(options);
		expect(result).toEqual([color.dim('...'), 'Item 7', 'Item 8', 'Item 9', 'Item 10']);
	});

	test('handles empty options list', async () => {
		options.options = [];
		const result = limitOptions(options);
		expect(result).toEqual([]);
	});

	test('if items exceed output height, clamp to fit', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{ value: 'Item 8' },
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		output.rows = 7;
		options.maxItems = 10;
		const result = limitOptions(options);
		expect(result).toEqual(['Item 1', 'Item 2', color.dim('...')]);
	});

	test('handle multi-line item clamping (start)', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{
				value: Array.from({ length: 4 })
					.map((_val, index) => `A long item that will take up a lot of space (line ${index})`)
					.join('\n'),
			},
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{ value: 'Item 8' },
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		output.rows = 14;
		options.maxItems = 10;
		const result = limitOptions(options);
		expect(result).toEqual([
			'Item 1',
			'Item 2',
			'A long item that will take up a lot of space (line 0)',
			'A long item that will take up a lot of space (line 1)',
			'A long item that will take up a lot of space (line 2)',
			'A long item that will take up a lot of space (line 3)',
			'Item 4',
			'Item 5',
			'Item 6',
			'Item 7',
			'Item 8',
			color.dim('...'),
		]);
	});

	test('handle multi-line item clamping (middle)', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{
				value: Array.from({ length: 4 })
					.map((_val, index) => `A long item that will take up a lot of space (line ${index})`)
					.join('\n'),
			},
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{ value: 'Item 8' },
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		output.rows = 14;
		options.maxItems = 10;
		options.cursor = 7;
		const result = limitOptions(options);
		expect(result).toEqual([
			color.dim('...'),
			'Item 2',
			'Item 3',
			'Item 4',
			'A long item that will take up a lot of space (line 0)',
			'A long item that will take up a lot of space (line 1)',
			'A long item that will take up a lot of space (line 2)',
			'A long item that will take up a lot of space (line 3)',
			'Item 6',
			'Item 7',
			'Item 8',
			color.dim('...'),
		]);
	});

	test('handle multi-line item clamping (end)', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{
				value: Array.from({ length: 4 })
					.map((_val, index) => `A long item that will take up a lot of space (line ${index})`)
					.join('\n'),
			},
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		output.rows = 14;
		options.maxItems = 10;
		options.cursor = 9;
		const result = limitOptions(options);
		expect(result).toEqual([
			color.dim('...'),
			'Item 4',
			'Item 5',
			'Item 6',
			'Item 7',
			'A long item that will take up a lot of space (line 0)',
			'A long item that will take up a lot of space (line 1)',
			'A long item that will take up a lot of space (line 2)',
			'A long item that will take up a lot of space (line 3)',
			'Item 9',
			'Item 10',
		]);
	});

	test('style option is used to style lines', async () => {
		options.options = [{ value: 'Item 1' }, { value: 'Item 2' }, { value: 'Item 3' }];
		options.maxItems = 5;
		options.style = (option) => `-- ${option.value} --`;
		const result = limitOptions(options);
		expect(result).toEqual(['-- Item 1 --', '-- Item 2 --', '-- Item 3 --']);
	});

	test('style option styles across multi-line items', async () => {
		options.options = [{ value: 'Item 1' }, { value: 'Item 2' }, { value: 'Item 3\nContinued' }];
		options.maxItems = 5;
		options.style = (option) => `-- ${option.value} --`;
		const result = limitOptions(options);
		expect(result).toEqual(['-- Item 1 --', '-- Item 2 --', '-- Item 3', 'Continued --']);
	});

	test('style option receives correct cursor index', async () => {
		options.options = [{ value: 'Item 1' }, { value: 'Item 2' }, { value: 'Item 3' }];
		options.maxItems = 5;
		options.cursor = 1;
		options.style = (option, isSelected) => {
			return isSelected ? `-- ${option.value} --` : option.value;
		};
		const result = limitOptions(options);
		expect(result).toEqual(['Item 1', '-- Item 2 --', 'Item 3']);
	});

	test('respects custom rowPadding', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{ value: 'Item 8' },
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		output.rows = 12;
		options.rowPadding = 6;
		// Available rows for options = 12 - 6 = 6
		const result = limitOptions(options);
		expect(result).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', color.dim('...')]);
	});

	test('respects custom rowPadding when scrolling', async () => {
		options.options = [
			{ value: 'Item 1' },
			{ value: 'Item 2' },
			{ value: 'Item 3' },
			{ value: 'Item 4' },
			{ value: 'Item 5' },
			{ value: 'Item 6' },
			{ value: 'Item 7' },
			{ value: 'Item 8' },
			{ value: 'Item 9' },
			{ value: 'Item 10' },
		];
		output.rows = 12;
		// Simulate a multiline message that takes 6 lines
		options.rowPadding = 6;
		// Move cursor to middle of list
		options.cursor = 5;
		// Available rows for options = 12 - 6 = 6
		const result = limitOptions(options);
		expect(result).toEqual([
			color.dim('...'),
			'Item 4',
			'Item 5',
			'Item 6',
			'Item 7',
			color.dim('...'),
		]);
	});
});
