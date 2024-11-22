import { ReadStream } from 'node:tty';

export class MockReadable extends ReadStream {
	protected _buffer: unknown[] | null = [];
	fd = 0 as const;

	constructor() {
		super(0);
	}

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
