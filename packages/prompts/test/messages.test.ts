import { settings, updateSettings } from '@clack/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as prompts from '../src/index.js';
import { MockWritable } from './test-utils.js';

describe('cancel', () => {
	let output: MockWritable;
	const defaultCancel = settings.messages.cancel;

	beforeEach(() => {
		output = new MockWritable();
	});

	afterEach(() => {
		updateSettings({ messages: { cancel: defaultCancel } });
	});

	test('renders the given message', () => {
		prompts.cancel('Installation canceled', { output });

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders the default cancel message when called without a message', () => {
		prompts.cancel(undefined, { output });

		expect(output.buffer).toMatchSnapshot();
	});

	test('renders the cancel message set with updateSettings', () => {
		updateSettings({ messages: { cancel: 'Operation cancelled' } });

		prompts.cancel(undefined, { output });

		expect(output.buffer).toMatchSnapshot();
	});

	test('an explicit empty message still renders nothing', () => {
		updateSettings({ messages: { cancel: 'Operation cancelled' } });

		prompts.cancel('', { output });

		expect(output.buffer).toMatchSnapshot();
	});
});
