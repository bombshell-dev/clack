export function findCursor<T extends { disabled?: boolean }>(
	cursor: number,
	delta: number,
	options: T[]
) {
	const hasEnabledOptions = options.some((opt) => !opt.disabled);
	if (!hasEnabledOptions) {
		return cursor;
	}
	const newCursor = cursor + delta;
	const maxCursor = Math.max(options.length - 1, 0);
	const clampedCursor = newCursor < 0 ? maxCursor : newCursor > maxCursor ? 0 : newCursor;
	const newOption = options[clampedCursor];
	if (newOption?.disabled) {
		return findCursor(clampedCursor, delta < 0 ? -1 : 1, options);
	}
	return clampedCursor;
}

export function findTextCursor(
	cursor: number,
	deltaX: number,
	deltaY: number,
	value: string
): number {
	const lines = value.split('\n');
	let cursorY = 0;
	let cursorX = cursor;

	for (const line of lines) {
		if (cursorX <= line.length) {
			break;
		}
		cursorX -= line.length + 1;
		cursorY++;
	}

	cursorY = Math.max(0, Math.min(lines.length - 1, cursorY + deltaY));

	// biome-ignore-start lint/style/noNonNullAssertion: cursorY/i are always kept within lines bounds
	cursorX = Math.min(cursorX, lines[cursorY]!.length) + deltaX;
	while (cursorX < 0 && cursorY > 0) {
		cursorY--;
		cursorX += lines[cursorY]!.length + 1;
	}
	while (cursorX > lines[cursorY]!.length && cursorY < lines.length - 1) {
		cursorX -= lines[cursorY]!.length + 1;
		cursorY++;
	}
	cursorX = Math.max(0, Math.min(lines[cursorY]!.length, cursorX));

	let newCursor = 0;
	for (let i = 0; i < cursorY; i++) {
		newCursor += lines[i]!.length + 1;
	}
	// biome-ignore-end lint/style/noNonNullAssertion: end of clamped cursor block
	return newCursor + cursorX;
}
