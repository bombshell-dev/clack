import type { Writable } from 'node:stream';
import { stripAnsi, wrap as wrapAnsi } from '@macfja/ansi';
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

/**
 * Create a function to render a frame base on the previous call (don't redraw lines that didn't change between 2 calls).
 *
 * @param output The Writable where to render
 * @return The rendering function to call with the new frame to display
 */
export function frameRenderer(output: Writable): (frame: string) => void {
	let prevFrame = '';
	return (frame: string) => {
		prevFrame = renderFrame(frame, prevFrame, output);
	};
}

/**
 * Create a function to render the next part of a sentence.
 * It will automatically wrap (without, if possible, breaking word).
 *
 * @param output The Writable where to render
 * @param joiner The prefix to put in front of each lines
 * @param removeLeadingSpace if `true` leading space of new lines will be removed
 * @return The rendering function to call with the next part of the content
 */
export function appendRenderer(
	output: Writable,
	joiner: string,
	removeLeadingSpace = true
): (next: string) => void {
	let lastLine = joiner;
	const joinerLength = stripAnsi(joiner).length + 1;
	const newLineRE = removeLeadingSpace ? /\n */g : /\n/g;

	return (next: string) => {
		const width = getColumns(output) - joinerLength;
		const lines =
			lastLine.substring(0, joiner.length) +
			wrapAnsi(`${lastLine.substring(joiner.length)}${next}`, width).replace(
				newLineRE,
				`\n${joiner}`
			);
		output?.write(cursor.move(-999, 0) + erase.lines(1));
		output?.write(lines);
		lastLine = lines.substring(Math.max(0, lines.lastIndexOf('\n') + 1));
	};
}
