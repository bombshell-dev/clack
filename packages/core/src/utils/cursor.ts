export function findPrevCursor<T extends { disabled?: boolean }>(cursor: number, options: T[]) {
	const prevCursor = cursor === 0 ? options.length - 1 : cursor - 1;
	const prevOption = options[prevCursor];
	if (prevOption.disabled) {
		return findPrevCursor(prevCursor, options);
	}
	return prevCursor;
}

export function findNextCursor<T extends { disabled?: boolean }>(cursor: number, options: T[]) {
	const nextCursor = cursor === options.length - 1 ? 0 : cursor + 1;
	const nextOption = options[nextCursor];
	if (nextOption.disabled) {
		return findNextCursor(nextCursor, options);
	}
	return nextCursor;
}
