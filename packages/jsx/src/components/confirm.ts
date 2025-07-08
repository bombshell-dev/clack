import type { ConfirmOptions } from '@clack/prompts';
import { confirm } from '@clack/prompts';

export type ConfirmProps = ConfirmOptions;

export function Confirm(props: ConfirmProps): ReturnType<typeof confirm> {
	return confirm(props);
}
