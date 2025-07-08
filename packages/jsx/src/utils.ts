import type { JSX } from './types.js';

export async function resolveChildren(
	children: JSX.Element[] | JSX.Element | string
): Promise<unknown[]> {
	const arr = Array.isArray(children) ? children : [children];
	const results: unknown[] = [];

	for (const child of arr) {
		const result = await child;

		results.push(result);
	}

	return results;
}
