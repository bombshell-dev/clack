import type { TextOptions } from '@clack/prompts';
import { text } from '@clack/prompts';
import type { JSX } from '../types.js';

export type TextProps = TextOptions;

export function Text(props: TextProps): JSX.Element {
	return {
		render: (options) =>
			text({
				input: options?.input,
				output: options?.output,
				...props,
			}),
	};
}
