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

export async function Select(props: SelectProps): ReturnType<typeof select> {
	const { children, ...opts } = props;
	const options: Option<unknown>[] = [];
	const resolvedChildren = await resolveChildren(props.children);

	for (const child of resolvedChildren) {
		if (isOptionLike(child)) {
			options.push(child);
		}
	}

	return select({
		...opts,
		options,
	});
}
