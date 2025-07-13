import { isCancel } from '@clack/prompts';
import type { JSX } from '../types.js';
import { resolveChildren } from '../utils.js';

export interface FormProps {
	children?: JSX.Element | JSX.Element[] | string;
}

function isChildLike(child: unknown): child is { name: PropertyKey; value: unknown } {
	return typeof child === 'object' && child !== null && 'name' in child && 'value' in child;
}

export function Form(props: FormProps): JSX.Element {
	return {
		render: async (options) => {
			const results: Record<PropertyKey, unknown> = {};

			if (props.children) {
				const resolvedChildren = await resolveChildren(props.children, options);

				for (const child of resolvedChildren) {
					if (isCancel(child)) {
						continue;
					}

					if (isChildLike(child)) {
						results[child.name] = child.value;
					}
				}
			}

			return results;
		},
	};
}
