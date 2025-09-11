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
});
