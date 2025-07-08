import type { TextOptions } from '@clack/prompts';
import { text } from '@clack/prompts';

export type TextProps = TextOptions;

export function Text(props: TextProps): ReturnType<typeof text> {
	return text(props);
}
