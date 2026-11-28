import { isBack, isCancel, settings } from '@clack/core';

/** Shift+Tab. Bound to the `back` action while a navigable group is running. */
const SHIFT_TAB_SEQUENCE = '\x1b[Z';

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

	/**
	 * Enable back navigation. When `true` (the default), pressing `Shift+Tab`
	 * during a prompt returns to the previous step. Answers are kept, and each
	 * step receives its previous answer as `previous` so it can be restored. Set
	 * to `false` to keep the group strictly forward-only.
	 *
	 * @default true
	 */
	navigate?: boolean;

	/**
	 * Called when the user returns to a previous step, with the name of the step
	 * being left and the step being returned to.
	 */
	onBack?: (opts: {
		from: keyof T;
		to: keyof T;
		results: Prettify<Partial<PromptGroupAwaitedReturn<T>>>;
	}) => void;
}

/**
 * A group of prompts to be displayed sequentially, with each prompt receiving
 * the results of all previous prompts in the group.
 */
export type PromptGroup<T> = {
	[P in keyof T]: (opts: {
		results: Prettify<Partial<PromptGroupAwaitedReturn<Omit<T, P>>>>;
		/**
		 * This step's previously-submitted answer, if the user has visited it
		 * before (e.g. after going back). Pass it to the prompt's `initialValue`
		 * to restore what they had entered.
		 */
		previous?: PromptGroupAwaitedReturn<T>[P];
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
 *   // `Shift+Tab` goes back; pass `previous` to `initialValue` to restore it.
 *   email: ({ previous }) => text({
 *     message: 'What is your email address?',
 *     initialValue: previous,
 *   }),
 *   username: ({ results, previous }) => text({
 *     message: 'What is your username?',
 *     initialValue: previous,
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
	const navigate = opts?.navigate !== false;

	// We bind Shift+Tab -> `back` only while a step that *can* go back is showing,
	// and restore the previous alias state afterwards so we never clobber a user's
	// own binding. We only manage the alias when the user hasn't bound it already.
	const manageAlias = navigate && !settings.aliases.has(SHIFT_TAB_SEQUENCE);
	const setBackEnabled = (enabled: boolean) => {
		if (!manageAlias) return;
		if (enabled) settings.aliases.set(SHIFT_TAB_SEQUENCE, 'back');
		else settings.aliases.delete(SHIFT_TAB_SEQUENCE);
	};

	try {
		let index = 0;
		while (index < promptNames.length) {
			// There is nowhere to go back to from the first step, so `back` is
			// disabled there (Shift+Tab does nothing); enabled from the second on.
			setBackEnabled(index > 0);

			// Safe: the loop condition guarantees `index` is in range.
			const name = promptNames[index] as string;
			const prompt = prompts[name as keyof T];
			// `previous` lets a revisited step restore what the user had entered.
			const result = await prompt({ results, previous: results[name] })?.catch((e) => {
				throw e;
			});

			// `back`: return to the previous step. Answers are kept (not discarded),
			// so each step can offer them back via `previous`. Guarded against the
			// first step in case a caller forces `back` there programmatically.
			if (navigate && isBack(result)) {
				if (index > 0) {
					const from = name as keyof T;
					index--;
					const to = promptNames[index] as keyof T;
					opts?.onBack?.({ from, to, results });
				}
				continue;
			}

			// Pass the results to the onCancel function
			// so the user can decide what to do with the results
			// TODO: Switch to callback within core to avoid isCancel Fn
			if (typeof opts?.onCancel === 'function' && isCancel(result)) {
				results[name] = 'canceled';
				opts.onCancel({ results });
				index++;
				continue;
			}

			results[name] = result;
			index++;
		}
	} finally {
		setBackEnabled(false);
	}

	return results;
};
