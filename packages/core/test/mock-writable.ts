import { Writable } from 'node:stream';

export class MockWritable extends Writable {
	public buffer: string[] = [];

	// biome-ignore lint/suspicious/noExplicitAny: any is the official type
	_write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
		this.buffer.push(chunk.toString());
		callback();
	}
}
