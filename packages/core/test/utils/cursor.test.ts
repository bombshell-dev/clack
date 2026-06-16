import { describe, expect, test } from 'vitest';
import { findCursor, findTextCursor, isSeparator } from '../../src/utils/cursor.js';

describe('isSeparator', () => {
	test('returns true for separator options', () => {
		expect(isSeparator({ type: 'separator' })).toBe(true);
		expect(isSeparator({ type: 'separator', label: 'Header' })).toBe(true);
	});

	test('returns false for non-separator options', () => {
		expect(isSeparator({ value: 'foo' })).toBe(false);
		expect(isSeparator({ value: 'foo', disabled: true })).toBe(false);
		expect(isSeparator({})).toBe(false);
		expect(isSeparator(null)).toBe(false);
		expect(isSeparator(undefined)).toBe(false);
	});
});

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

	test('skips separator options', () => {
		const options = [{ value: 'a' }, { type: 'separator' as const, label: '---' }, { value: 'b' }];
		expect(findCursor(0, 1, options)).toBe(2);
		expect(findCursor(2, -1, options)).toBe(0);
	});

	test('returns same cursor if all options are separators or disabled', () => {
		const options = [{ type: 'separator' as const }, { disabled: true }];
		expect(findCursor(0, 1, options)).toBe(0);
	});

	test('skips mix of separators and disabled', () => {
		const options = [
			{ value: 'a' },
			{ type: 'separator' as const },
			{ disabled: true },
			{ value: 'b' },
		];
		expect(findCursor(0, 1, options)).toBe(3);
		expect(findCursor(3, -1, options)).toBe(0);
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
