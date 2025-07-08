import { type Option, isCancel } from '@clack/prompts';
import type { JSX } from '../types.js';
import { resolveChildren } from '../utils.js';

export interface OptionProps {
	value: unknown;
	children?: JSX.Element | JSX.Element[] | string;
}

export async function Option(props: OptionProps): Promise<Option<unknown>> {
	let label = '';
	if (props.children) {
		const children = await resolveChildren(props.children);
		const childStrings: string[] = [];

		for (const child of children) {
			if (isCancel(child)) {
				continue;
			}
			childStrings.push(String(child));
		}

		label = childStrings.join('\n');
	} else {
		label = String(props.value);
	}
	return {
		value: props.value,
		label,
	};
}
