import { type Option as PromptOption, isCancel } from '@clack/prompts';
import type { JSX } from '../types.js';
import { resolveChildren } from '../utils.js';

export interface OptionProps<T> {
	value: T;
	hint?: string;
	children?: JSX.Element | JSX.Element[] | string;
}

export function Option<T>(props: OptionProps<T>): JSX.Element {
	return {
		render: async (options) => {
			const { children, ...opts } = props;

			if (children) {
				const resolvedChildren = await resolveChildren(children, options);
				const childStrings: string[] = [];

				for (const child of resolvedChildren) {
					if (isCancel(child)) {
						continue;
					}
					childStrings.push(String(child));
				}

				return {
					...opts,
					label: childStrings.join('\n'),
				} as PromptOption<T>;
			}

			return opts as PromptOption<T>;
		},
	};
}
