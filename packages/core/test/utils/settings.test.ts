import { afterEach, describe, expect, test } from 'vitest';
import { isAccessible, settings, updateSettings } from '../../src/utils/settings.js';

describe('isAccessible', () => {
	const originalEnv = process.env.ACCESSIBLE;

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.ACCESSIBLE;
		} else {
			process.env.ACCESSIBLE = originalEnv;
		}
		settings.accessible = undefined;
	});

	describe('ACCESSIBLE env var', () => {
		test('disabled when unset', () => {
			delete process.env.ACCESSIBLE;
			expect(isAccessible()).toBe(false);
		});

		test.each(['', '0', 'false'])('disabled when set to %j', (value) => {
			process.env.ACCESSIBLE = value;
			expect(isAccessible()).toBe(false);
		});

		test.each(['1', 'true', 'yes'])('enabled when set to %j', (value) => {
			process.env.ACCESSIBLE = value;
			expect(isAccessible()).toBe(true);
		});
	});

	describe('global setting', () => {
		test('updateSettings({ accessible: true }) enables it', () => {
			delete process.env.ACCESSIBLE;
			updateSettings({ accessible: true });
			expect(isAccessible()).toBe(true);
		});

		test('updateSettings({ accessible: false }) overrides the env var', () => {
			process.env.ACCESSIBLE = '1';
			updateSettings({ accessible: false });
			expect(isAccessible()).toBe(false);
		});
	});

	describe('per-call option', () => {
		test('true overrides a false global setting', () => {
			updateSettings({ accessible: false });
			expect(isAccessible(true)).toBe(true);
		});

		test('false overrides the env var', () => {
			process.env.ACCESSIBLE = '1';
			expect(isAccessible(false)).toBe(false);
		});

		test('undefined falls through to env var', () => {
			process.env.ACCESSIBLE = '1';
			expect(isAccessible(undefined)).toBe(true);
		});
	});
});
