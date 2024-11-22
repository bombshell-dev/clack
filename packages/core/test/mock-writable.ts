import { WriteStream } from 'node:tty';

export class MockWritable extends WriteStream {
	public buffer: string[] = [];
	fd = 1 as const;

	constructor() {
		super(1);
	}

	// biome-ignore lint/suspicious/noExplicitAny: any is the official type
	_write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
		this.buffer.push(chunk.toString());
		callback();
	}
}
