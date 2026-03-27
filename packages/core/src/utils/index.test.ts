import type { Key } from 'node:readline';
import { cursor } from 'sisteransi';
import { describe, expect, test, vi } from 'vitest';
import { block } from './index.js';
import { createMocks } from '@bomb.sh/tools/test-utils';

describe('utils', () => {
	describe('block', () => {
		test('clears output on keypress', () => {
			const { input, output } = createMocks({ input: true, output: true });
			const callback = block({ input, output });

			const event: Key = {
				name: 'x',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.move(-1, 0), cursor.show]);
		});

		test('clears output vertically when return pressed', () => {
			const { input, output } = createMocks({ input: true, output: true });
			const callback = block({ input, output });

			const event: Key = {
				name: 'return',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.move(0, -1), cursor.show]);
		});

		test('ignores additional keypresses after dispose', () => {
			const { input, output } = createMocks({ input: true, output: true });
			const callback = block({ input, output });

			const event: Key = {
				name: 'x',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			input.emit('keypress', eventData, event);
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.move(-1, 0), cursor.show]);
		});

		test('exits on ctrl-c', () => {
			const { input, output } = createMocks({ input: true, output: true });
			// purposely don't keep the callback since we would exit the process
			block({ input, output });
			const spy = vi.spyOn(process, 'exit').mockImplementation((() => {
				return;
			}) as () => never);

			const event: Key = {
				name: 'c',
			};
			const eventData = Buffer.from('\x03');
			input.emit('keypress', eventData, event);
			expect(spy).toHaveBeenCalled();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.show]);
		});

		test('does not clear if overwrite=false', () => {
			const { input, output } = createMocks({ input: true, output: true });
			const callback = block({ input, output, overwrite: false });

			const event: Key = {
				name: 'c',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.show]);
		});
	});
});
