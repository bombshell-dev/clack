import { Writable } from 'node:stream';

export class MockWritable extends Writable {
	public buffer: string[] = [];

	_write(
		chunk: any,
		_encoding: BufferEncoding,
		callback: (error?: Error | null | undefined) => void
	): void {
		this.buffer.push(chunk.toString());
		callback();
	}
}
