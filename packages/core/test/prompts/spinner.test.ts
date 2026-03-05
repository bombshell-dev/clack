import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as SpinnerPrompt } from '../../src/prompts/spinner.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('SpinnerPrompt', () => {
	let input: MockReadable;
	let output: MockWritable;
	let instance: SpinnerPrompt;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		instance.stop();
	});

	test('renders render() result', () => {
		instance = new SpinnerPrompt({
			input,
			output,
			frames: ['J', 'A', 'M', 'E', 'S'],
			delay: 5,
			render: () => 'foo',
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	describe('start', () => {
		test('starts the spinner and updates frames', () => {
			instance = new SpinnerPrompt({
				input,
				output,
				frames: ['J', 'A', 'M', 'E', 'S'],
				delay: 5,
				render: () => 'foo',
			});
			instance.start('Loading');
			expect(instance.message).to.equal('Loading');
			expect(instance.frameIndex).to.equal(0);
			expect(instance.indicatorTimer).to.equal(0);
			vi.advanceTimersByTime(5);
			expect(instance.frameIndex).to.equal(1);
			expect(instance.indicatorTimer).to.equal(0.125);
			vi.advanceTimersByTime(5);
			expect(instance.frameIndex).to.equal(2);
			expect(instance.indicatorTimer).to.equal(0.25);
			vi.advanceTimersByTime(5);
			expect(instance.frameIndex).to.equal(3);
			expect(instance.indicatorTimer).to.equal(0.375);
		});

		test('starting again resets the spinner', () => {
			instance = new SpinnerPrompt({
				input,
				output,
				frames: ['J', 'A', 'M', 'E', 'S'],
				delay: 5,
				render: () => 'foo',
			});
			instance.start('Loading');
			vi.advanceTimersByTime(10);
			expect(instance.frameIndex).to.equal(2);
			expect(instance.indicatorTimer).to.equal(0.25);
			expect(instance.message).to.equal('Loading');
			instance.start('Loading again');
			expect(instance.message).to.equal('Loading again');
			expect(instance.frameIndex).to.equal(0);
			expect(instance.indicatorTimer).to.equal(0);
		});
	});

	describe('stop', () => {
		test('stops the spinner and sets message', () => {
			instance = new SpinnerPrompt({
				input,
				output,
				frames: ['J', 'A', 'M', 'E', 'S'],
				delay: 5,
				render: () => 'foo',
			});
			instance.start('Loading');
			vi.advanceTimersByTime(10);
			instance.stop('Done');
			expect(instance.message).to.equal('Canceled');
			expect(instance.isActive).to.equal(false);
			expect(instance.isCancelled).to.equal(true);
			expect(instance.silentExit).to.equal(false);
			expect(instance.exitCode).to.equal(1);
			expect(instance.state).to.equal('cancel');
			expect(output.buffer).to.deep.equal([cursor.hide, 'foo', '\n']);
		});

		test('does nothing if spinner is not active', () => {
			instance = new SpinnerPrompt({
				input,
				output,
				frames: ['J', 'A', 'M', 'E', 'S'],
				delay: 5,
				render: () => 'foo',
			});
			instance.stop('Done');
			expect(instance.message).to.equal('');
			expect(instance.isActive).to.equal(false);
			expect(instance.silentExit).to.equal(false);
			expect(instance.exitCode).to.equal(undefined);
			expect(instance.state).to.equal('initial');
			expect(output.buffer).to.deep.equal([]);
		});
	});

	test('message strips trailing dots', () => {
		instance = new SpinnerPrompt({
			input,
			output,
			frames: ['J', 'A', 'M', 'E', 'S'],
			delay: 5,
			render: () => 'foo',
		});
		instance.start('Loading...');
		expect(instance.message).to.equal('Loading');

		instance.message = 'Still loading....';
		expect(instance.message).to.equal('Still loading');
	});

	describe('getFormattedTimer', () => {
		test('formats timer correctly', () => {
			instance = new SpinnerPrompt({
				input,
				output,
				frames: ['J', 'A', 'M', 'E', 'S'],
				delay: 5,
				render: () => 'foo',
			});
			instance.start();
			expect(instance.getFormattedTimer()).to.equal('[0s]');
			vi.advanceTimersByTime(1500);
			expect(instance.getFormattedTimer()).to.equal('[1s]');
			vi.advanceTimersByTime(600_000);
			expect(instance.getFormattedTimer()).to.equal('[10m 1s]');
		});
	});
});
