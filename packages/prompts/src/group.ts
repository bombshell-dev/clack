import { isCancel } from '@clack/core';

type Prettify<T> = {
	[P in keyof T]: T[P];
} & {};

/**
 * The return type of a {@link PromptGroup}.
 * Resolves all prompt results, excluding the cancel symbol.
 */
export type PromptGroupAwaitedReturn<T> = {
	[P in keyof T]: Exclude<Awaited<T[P]>, symbol>;
};

/**
 * Options for the {@link group} utility.
 */
export interface PromptGroupOptions<T> {
	/**
	 * Called when any one of the prompts is canceled.
	 */
	onCancel?: (opts: { results: Prettify<Partial<PromptGroupAwaitedReturn<T>>> }) => void;
}

/**
 * A group of prompts to be displayed sequentially, with each prompt receiving
 * the results of all previous prompts in the group.
 */
export type PromptGroup<T> = {
	[P in keyof T]: (opts: {
		results: Prettify<Partial<PromptGroupAwaitedReturn<Omit<T, P>>>>;
	}) => undefined | Promise<T[P] | undefined>;
};

/**
 * The `group` utility provides a consistent way to combine a series of prompts,
 * combining each answer into one object. Each prompt receives the results of
 * all previously completed prompts, and are displayed sequentially.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#group
 *
 * @example
 * ```ts
 * import { group, text, password } from '@clack/prompts';
 *
 * const account = await group({
 *   email: () => text({
 *     message: 'What is your email address?',
 *   }),
 *   username: ({ results }) => text({
 *     message: 'What is your username?',
 *     placeholder: results.email?.replace(/@.+$/, '').toLowerCase() ?? '',
 *   }),
 *   password: () => password({
 *     message: 'Define your password',
 *   }),
 * });
 * ```
 */
export const group = async <T>(
	prompts: PromptGroup<T>,
	opts?: PromptGroupOptions<T>
): Promise<Prettify<PromptGroupAwaitedReturn<T>>> => {
	const results = {} as any;
	const promptNames = Object.keys(prompts);

	for (const name of promptNames) {
		const prompt = prompts[name as keyof T];
		const result = await prompt({ results })?.catch((e) => {
			throw e;
		});

		// Pass the results to the onCancel function
		// so the user can decide what to do with the results
		// TODO: Switch to callback within core to avoid isCancel Fn
		if (typeof opts?.onCancel === 'function' && isCancel(result)) {
			results[name] = 'canceled';
			opts.onCancel({ results });
			continue;
		}

		results[name] = result;
	}

	return results;
};
