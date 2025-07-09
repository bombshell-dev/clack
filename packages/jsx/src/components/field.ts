import { isCancel } from '@clack/prompts';
import type { JSX } from '../types.js';
import { resolveChildren } from '../utils.js';

export interface FieldResult {
	name: PropertyKey;
	value: unknown;
}

export interface FieldProps {
	name: PropertyKey;
	children?: JSX.Element | JSX.Element[] | string;
}

export function Field(props: FieldProps): () => Promise<FieldResult> {
	return async () => {
		let value: unknown = undefined;

		if (props.children) {
			const resolvedChildren = await resolveChildren(props.children);
			const valueArr: unknown[] = [];

			for (const child of resolvedChildren) {
				if (!isCancel(child)) {
					valueArr.push(child);
				}
			}

			if (valueArr.length === 1) {
				value = valueArr[0];
			} else {
				value = valueArr;
			}
		}

		return {
			name: props.name,
			value,
		};
	};
}
