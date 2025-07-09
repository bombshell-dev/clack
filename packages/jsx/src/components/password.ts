import type { PasswordOptions } from '@clack/prompts';
import { password } from '@clack/prompts';

export type PasswordProps = PasswordOptions;

export function Password(props: PasswordProps): () => ReturnType<typeof password> {
	return () => password(props);
}
