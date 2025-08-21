import type { PasswordOptions } from '@clack/prompts';
import { password } from '@clack/prompts';
import type { JSX } from '../types.js';

export type PasswordProps = PasswordOptions;

export function Password(props: PasswordProps): JSX.Element {
	return {
		render: (options) =>
			password({
				input: options?.input,
				output: options?.output,
				...props,
			}),
	};
}
