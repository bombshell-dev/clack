import type { ConfirmOptions } from '@clack/prompts';
import { confirm } from '@clack/prompts';

namespace JSX {
	export interface IntrinsicElements {
	}

	export type Element = Promise<unknown>;
}

export type { JSX };

export function Confirm(props: ConfirmOptions): ReturnType<typeof confirm> {
	return confirm(props);
}

export type Component =
	| typeof Confirm;

function jsx<T extends keyof JSX.IntrinsicElements>(
	tag: T,
	props: JSX.IntrinsicElements[T],
	_key?: string
): JSX.Element;
function jsx<T extends Component>(
	fn: T,
	props: Parameters<T>[0],
	_key?: string
): JSX.Element;
function jsx(
	tagOrFn: string | Component,
	props: unknown,
	_key?: string
): JSX.Element {
	if (typeof tagOrFn === 'function') {
		return (tagOrFn as (props: unknown) => JSX.Element)(props);
	}
	return Promise.resolve(null);
}

export { jsx };
export const jsxDEV = jsx;
