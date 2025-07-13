import type { ConfirmOptions } from '@clack/prompts';
import { confirm } from '@clack/prompts';
import type { JSX } from '../types.js';

export type ConfirmProps = ConfirmOptions;

export function Confirm(props: ConfirmProps): JSX.Element {
	return {
		render: (options) =>
			confirm({
				input: options?.input,
				output: options?.output,
				...props,
			}),
	};
}
