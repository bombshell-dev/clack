import type { Writable } from 'node:stream';
import { cursor, erase } from 'sisteransi';
import wrap from 'wrap-ansi';
import { getColumns } from './index.js';
import { diffLines } from './string.js';

function restoreCursor(output: Writable, prevFrame: string) {
	const lines = prevFrame.split('\n').length - 1;
	output.write(cursor.move(-999, lines * -1));
}

function renderFrame(newFrame: string, prevFrame: string, output: Writable): string {
	const frame = wrap(newFrame, getColumns(output), { hard: true });
	if (frame === prevFrame) return frame;

	if (prevFrame === '') {
		output.write(frame);
		return frame;
	}

	const diff = diffLines(prevFrame, frame);
	restoreCursor(output, prevFrame);
	// If a single line has changed, only update that line
	if (diff && diff?.length === 1) {
		const diffLine = diff[0];
		output.write(cursor.move(0, diffLine));
		output.write(erase.lines(1));
		const lines = frame.split('\n');
		output.write(lines[diffLine]);
		output.write(cursor.move(0, lines.length - diffLine - 1));
		return frame;
	}
	// If many lines have changed, rerender everything past the first line
	if (diff && diff?.length > 1) {
		const diffLine = diff[0];
		output.write(cursor.move(0, diffLine));
		output.write(erase.down());
		const lines = frame.split('\n');
		const newLines = lines.slice(diffLine);
		output.write(newLines.join('\n'));
		return frame;
	}

	output.write(erase.down());
	output.write(frame);

	return frame;
}

export function frameRenderer(output: Writable): (frame: string) => void {
	let prevFrame = '';
	return (frame: string) => {
		prevFrame = renderFrame(frame, prevFrame, output);
	};
}
