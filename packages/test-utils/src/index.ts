export { MockReadable } from './mock-readable.js';
export { MockWritable } from './mock-writable.js';

export function nextTick(): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}
