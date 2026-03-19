import { Readable, Writable } from 'node:stream';

export class MockWritable extends Writable {
	public buffer: string[] = [];
	public isTTY = false;
	public columns = 80;
	public rows = 20;

	_write(
		chunk: any,
		_encoding: BufferEncoding,
		callback: (error?: Error | null | undefined) => void
	): void {
		this.buffer.push(chunk.toString());
		callback();
	}
}

export class MockReadable extends Readable {
	protected _buffer: unknown[] | null = [];

	_read() {
		if (this._buffer === null) {
			this.push(null);
			return;
		}

		for (const val of this._buffer) {
			this.push(val);
		}

		this._buffer = [];
	}

	pushValue(val: unknown): void {
		this._buffer?.push(val);
	}

	close(): void {
		this._buffer = null;
	}
}
