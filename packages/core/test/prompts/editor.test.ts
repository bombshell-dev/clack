import { vol } from 'memfs';
import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as EditorPrompt } from '../../src/prompts/editor.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

vi.mock('node:fs');
vi.mock('node:os');
vi.mock('node:child_process');

describe('EditorPrompt', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
		vol.reset();
		vol.fromJSON({ './cache-abc': 'foo' }, '/tmp');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders render() result', () => {
		const instance = new EditorPrompt({
			input,
			output,
			render: () => 'foo',
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('sets value and submits on confirm', () => {
		const instance = new EditorPrompt({
			input,
			output,
			render: () => 'foo',
			initialValue: 'hello',
		});

		instance.prompt();
		input.emit('keypress', '\r', { name: 'return' });

		expect(instance.value).to.equal('hello');
		expect(instance.state).to.equal('submit');
	});
});
