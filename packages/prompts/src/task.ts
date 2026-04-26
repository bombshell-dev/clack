import type { CommonOptions } from './common.js';
import { spinner } from './spinner.js';

/**
 * A single task to be executed by the {@link tasks} function.
 */
export type Task = {
	/**
	 * Task title displayed as the spinner message.
	 */
	title: string;

	/**
	 * Task function to execute. Receives a message updater function.
	 */
	task: (message: (msg: string) => void) => string | Promise<string> | void | Promise<void>;

	/**
	 * If set to false, the task will be skipped.
	 * @default true
	 */
	enabled?: boolean;
};

/**
 * The `tasks` function executes a series of tasks sequentially,
 * displaying a spinner for each one.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#tasks
 *
 * @example
 * ```ts
 * import { tasks } from '@clack/prompts';
 *
 * await tasks([
 *   {
 *     title: 'Installing dependencies',
 *     task: (message) => {
 *       message('Running npm install...');
 *       // ... install logic ...
 *     },
 *   },
 *   {
 *     title: 'Building project',
 *     task: async (message) => {
 *       message('Compiling...');
 *       await build();
 *     },
 *   },
 * ]);
 * ```
 */
export const tasks = async (tasks: Task[], opts?: CommonOptions) => {
	for (const task of tasks) {
		if (task.enabled === false) continue;

		const s = spinner(opts);
		s.start(task.title);
		const result = await task.task(s.message);
		s.stop(result || task.title);
	}
};
