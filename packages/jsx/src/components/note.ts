import type { NoteOptions } from '@clack/prompts';
import { isCancel, note } from '@clack/prompts';
import type { JSX } from '../types.js';
import { resolveChildren } from '../utils.js';

export interface NoteProps extends NoteOptions {
	children?: JSX.Element[] | JSX.Element | string;
	message?: string;
	title?: string;
}

export function Note(props: NoteProps): JSX.Element {
	return {
		render: async (options) => {
			let message = '';

			if (props.children) {
				const messages: string[] = [];
				const children = await resolveChildren(props.children, options);
				for (const child of children) {
					// TODO (43081j): handle cancelling of children
					if (isCancel(child)) {
						continue;
					}
					messages.push(String(child));
				}
				message = messages.join('\n');
			} else if (props.message) {
				message = props.message;
			}

			note(message, props.title, {
				input: options?.input,
				output: options?.output,
				...props,
			});
		},
	};
}
