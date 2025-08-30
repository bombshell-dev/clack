import type { CommonOptions } from '@clack/prompts';

export interface RenderOptions extends CommonOptions {}

export type RenderFunction = (options?: RenderOptions) => Promise<unknown>;

namespace JSX {
	export type IntrinsicElements = never;

	export type Element = {
		render: RenderFunction;
	};
}

export type { JSX };
