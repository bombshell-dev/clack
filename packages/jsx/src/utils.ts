import type { JSX, RenderOptions } from './types.js';

export async function resolveChildren(
	children: JSX.Element[] | JSX.Element | string,
	options?: RenderOptions
): Promise<unknown[]> {
	const arr = Array.isArray(children) ? children : [children];
	const results: unknown[] = [];

	for (const child of arr) {
		const result = typeof child === 'string' ? child : await child.render(options);

		results.push(result);
	}

	return results;
}
