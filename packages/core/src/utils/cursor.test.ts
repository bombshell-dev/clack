import { describe, expect, test } from 'vitest';
import { findCursor, findTextCursor } from '../../src/utils/cursor.js';

describe('findCursor', () => {
	test('returns the same cursor if all options are disabled', () => {
		const options = [{ disabled: true }, { disabled: true }];
		expect(findCursor(0, 1, options)).toBe(0);
	});

	test('skips disabled options', () => {
		const options = [{ disabled: false }, { disabled: true }, { disabled: false }];
		expect(findCursor(0, 1, options)).toBe(2);
		expect(findCursor(2, -1, options)).toBe(0);
	});

	test('wraps around the options', () => {
		const options = [{ disabled: false }, { disabled: false }, { disabled: false }];
		expect(findCursor(2, 1, options)).toBe(0);
		expect(findCursor(0, -1, options)).toBe(2);
	});

	test('handles empty options', () => {
		const options: { disabled?: boolean }[] = [];
		expect(findCursor(0, 1, options)).toBe(0);
		expect(findCursor(0, -1, options)).toBe(0);
	});
});

describe('findTextCursor', () => {
	test('moves cursor horizontally', () => {
		const value = 'Hello\nWorld';
		expect(findTextCursor(0, 1, 0, value)).toBe(1);
		expect(findTextCursor(5, 1, 0, value)).toBe(6);
		expect(findTextCursor(5, -1, 0, value)).toBe(4);
	});

	test('moves cursor vertically', () => {
		const value = 'Hello\nWorld';
		expect(findTextCursor(0, 0, 1, value)).toBe(6);
		expect(findTextCursor(6, 0, -1, value)).toBe(0);
	});

	test('moves on both axes', () => {
		const value = 'Line 1\nLine 2\nLine 3';
		expect(findTextCursor(0, 1, 1, value)).toBe(8);
		expect(findTextCursor(7, 1, 1, value)).toBe(15);
		expect(findTextCursor(14, -1, -1, value)).toBe(6);
	});

	test('handles empty value', () => {
		const value = '';
		expect(findTextCursor(0, 1, 0, value)).toBe(0);
		expect(findTextCursor(0, 0, 1, value)).toBe(0);
	});

	test('handles single line value', () => {
		const value = 'Single line';
		expect(findTextCursor(0, 1, 0, value)).toBe(1);
		expect(findTextCursor(5, -1, 0, value)).toBe(4);
		expect(findTextCursor(0, 0, 1, value)).toBe(0);
	});

	test('handles cursor at end of line', () => {
		const value = 'Hello\nWorld';
		expect(findTextCursor(5, 1, 0, value)).toBe(6);
		expect(findTextCursor(11, -1, 0, value)).toBe(10);
	});
});
