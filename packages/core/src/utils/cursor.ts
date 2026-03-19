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
	if (newOption.disabled) {
		return findCursor(clampedCursor, delta < 0 ? -1 : 1, options);
	}
	return clampedCursor;
}
