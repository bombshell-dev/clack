import type { Option, SelectOptions } from '@clack/prompts';
import { select } from '@clack/prompts';
import type { JSX } from '../types.js';
import { resolveChildren } from '../utils.js';

export interface SelectProps extends Omit<SelectOptions<unknown>, 'options'> {
	children: JSX.Element[] | JSX.Element | string;
}

const isOptionLike = (obj: unknown): obj is Option<unknown> => {
	return obj !== null && typeof obj === 'object' && Object.hasOwnProperty.call(obj, 'value');
};

export function Select(props: SelectProps): JSX.Element {
	return {
		render: async (renderOptions) => {
			const { children, ...opts } = props;
			const options: Option<unknown>[] = [];
			const resolvedChildren = await resolveChildren(props.children, renderOptions);

			for (const child of resolvedChildren) {
				if (isOptionLike(child)) {
					options.push(child);
				}
			}

			return select({
				input: renderOptions?.input,
				output: renderOptions?.output,
				...opts,
				options,
			});
		},
	};
}
