import type { ConfirmOptions } from '@clack/prompts';

namespace JSX {
	export interface IntrinsicElements {
		confirm: ConfirmOptions;
	}

	export type Element = unknown;
}

export type { JSX };

export function Confirm(_props: JSX.IntrinsicElements['confirm']): JSX.Element {
	return 'foo';
}

export function jsx<T extends keyof JSX.IntrinsicElements>(
	tag: T,
	props: JSX.IntrinsicElements[T],
	_key?: string
): JSX.Element {
	return 'foo';
}

export const jsxDEV = jsx;
