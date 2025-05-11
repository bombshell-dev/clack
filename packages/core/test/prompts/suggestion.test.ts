import color from 'picocolors';
import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as SelectPrompt } from '../../src/prompts/select.js';
import { default as SuggestionPrompt } from '../../src/prompts/suggestion.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe(SuggestionPrompt.name, () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('displayValue getter return all parts/cases', () => {
		test('no suggestion, cursor at the end', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => [],
				initialValue: 'Lorem ipsum',
				render: () => 'Lorem ipsum',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			expect(instance.displayValue).to.deep.equal([
				{ text: 'Lorem ipsum', type: 'value' },
				{ text: '\u00a0', type: 'cursor_on_value' },
			]);
		});

		test('no suggestion, cursor at the start', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => [],
				initialValue: 'Lorem',
				render: () => 'Lorem',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			for (let index = 0; index < 5; index++) input.emit('keypress', '', { name: 'left' });
			expect(instance.displayValue).to.deep.equal([
				{ text: 'L', type: 'cursor_on_value' },
				{ text: 'orem', type: 'value' },
			]);
		});
		test('no suggestion, cursor in the middle', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => [],
				initialValue: 'Lorem',
				render: () => 'Lorem',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			for (let index = 0; index < 3; index++) input.emit('keypress', '', { name: 'left' });
			expect(instance.displayValue).to.deep.equal([
				{ text: 'Lo', type: 'value' },
				{ text: 'r', type: 'cursor_on_value' },
				{ text: 'em', type: 'value' },
			]);
		});
		test('no suggestion, cursor on the last letter', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => [],
				initialValue: 'Lorem',
				render: () => 'Lorem',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			input.emit('keypress', '', { name: 'left' });
			expect(instance.displayValue).to.deep.equal([
				{ text: 'Lore', type: 'value' },
				{ text: 'm', type: 'cursor_on_value' },
			]);
		});
		test('with suggestion, cursor at the end', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['Lorem ipsum dolor sit amet, consectetur adipiscing elit'],
				initialValue: 'Lorem ipsum dolor sit amet',
				render: () => 'Lorem ipsum dolor sit amet',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			expect(instance.displayValue).to.deep.equal([
				{ text: 'Lorem ipsum dolor sit amet', type: 'value' },
				{ text: ',', type: 'cursor_on_suggestion' },
				{ text: ' consectetur adipiscing elit', type: 'suggestion' },
			]);
		});
		test('with suggestion, cursor not at the end', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['Lorem ipsum dolor sit amet, consectetur adipiscing elit'],
				initialValue: 'Lorem ipsum dolor sit amet',
				render: () => 'Lorem ipsum dolor sit amet',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			for (let index = 0; index < 3; index++) input.emit('keypress', '', { name: 'left' });
			expect(instance.displayValue).to.deep.equal([
				{ text: 'Lorem ipsum dolor sit a', type: 'value' },
				{ text: 'm', type: 'cursor_on_value' },
				{ text: 'et', type: 'value' },
				{ text: ', consectetur adipiscing elit', type: 'suggestion' },
			]);
		});
	});
	describe('navigate suggestion', () => {
		test('the default is the first suggestion', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['foobar', 'foobaz'],
				initialValue: 'foo',
				render: () => 'foo',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			expect(instance.suggestion).to.be.equal('bar');
		});
		test('down display next suggestion', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['foobar', 'foobaz'],
				initialValue: 'foo',
				render: () => 'foo',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			input.emit('keypress', '', { name: 'down' });

			expect(instance.suggestion).to.be.equal('baz');
		});
		test('suggestions loops (down)', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['foobar', 'foobaz'],
				initialValue: 'foo',
				render: () => 'foo',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			expect(instance.suggestion).to.be.equal('bar');
			input.emit('keypress', '', { name: 'down' });
			expect(instance.suggestion).to.be.equal('baz');
			input.emit('keypress', '', { name: 'down' });
			expect(instance.suggestion).to.be.equal('bar');
		});

		test('suggestions loops (up)', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['foobar', 'foobaz'],
				initialValue: 'foo',
				render: () => 'foo',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			expect(instance.suggestion).to.be.equal('bar');
			input.emit('keypress', '', { name: 'up' });
			expect(instance.suggestion).to.be.equal('baz');
			input.emit('keypress', '', { name: 'up' });
			expect(instance.suggestion).to.be.equal('bar');
		});
	});
	test('tab validate suggestion', () => {
		const instance = new SuggestionPrompt({
			input,
			output,
			suggest: () => ['foobar', 'foobaz'],
			initialValue: 'foo',
			render: () => 'foo',
		});
		// leave the promise hanging since we don't want to submit in this test
		instance.prompt();
		expect(instance.suggestion).to.be.equal('bar');
		expect(instance.value).to.be.equal('foo');
		input.emit('keypress', '', { name: 'tab' });
		expect(instance.suggestion).to.be.equal('');
		expect(instance.value).to.be.equal('foobar');
	});
	describe('suggestion are filtered', () => {
		test("suggestion that don't match (begin) at not displayed", () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['foobar', 'foobaz', 'hello world'],
				initialValue: 'foo',
				render: () => 'foo',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			expect((instance as unknown as { nextItems: Array<string> }).nextItems.length).to.be.equal(2);
		});
		test('empty suggestions are removed', () => {
			const instance = new SuggestionPrompt({
				input,
				output,
				suggest: () => ['foo'],
				initialValue: 'foo',
				render: () => 'foo',
			});
			// leave the promise hanging since we don't want to submit in this test
			instance.prompt();
			expect((instance as unknown as { nextItems: Array<string> }).nextItems.length).to.be.equal(0);
		});
	});
});
