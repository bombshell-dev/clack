export function diffLines(a: string, b: string) {
	if (a === b) return;

	const aLines = a.split('\n');
	const bLines = b.split('\n');
	const numLines = Math.max(aLines.length, bLines.length);
	const diff: number[] = [];

	for (let i = 0; i < numLines; i++) {
		if (aLines[i] !== bLines[i]) diff.push(i);
	}

	return {
		lines: diff,
		numLinesBefore: aLines.length,
		numLinesAfter: bLines.length,
		numLines,
	};
}
