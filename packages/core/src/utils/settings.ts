const actions = ['up', 'down', 'left', 'right', 'space', 'enter', 'cancel'] as const;
export type Action = (typeof actions)[number];

/** Global settings for Clack programs, stored in memory */
interface InternalClackSettings {
	actions: Set<Action>;
	aliases: Map<string, Action>;
	messages: {
		cancel: string;
		error: string;
	};
}

export const settings: InternalClackSettings = {
	actions: new Set(actions),
	aliases: new Map<string, Action>([
		// vim support
		['k', 'up'],
		['j', 'down'],
		['h', 'left'],
		['l', 'right'],
		['\x03', 'cancel'],
		// opinionated defaults!
		['escape', 'cancel'],
	]),
	messages: {
		cancel: 'Canceled',
		error: 'Something went wrong',
	},
};

export interface ClackSettings {
	/**
	 * Set custom global aliases for the default actions.
	 * This will not overwrite existing aliases, it will only add new ones!
	 *
	 * @param aliases - An object that maps aliases to actions
	 * @default { k: 'up', j: 'down', h: 'left', l: 'right', '\x03': 'cancel', 'escape': 'cancel' }
	 */
	aliases?: Record<string, Action>;

	/**
	 * Custom messages for prompts
	 */
	messages?: {
		/**
		 * Custom message to display when a spinner is cancelled
		 * @default "Canceled"
		 */
		cancel?: string;
		/**
		 * Custom message to display when a spinner encounters an error
		 * @default "Something went wrong"
		 */
		error?: string;
	};
}

export function updateSettings(updates: ClackSettings) {
	for (const _key in updates) {
		const key = _key as keyof ClackSettings;
		if (!Object.hasOwn(updates, key)) continue;
		const value = updates[key];

		switch (key) {
			case 'aliases': {
				const aliases = value as Record<string, Action>;
				for (const alias in aliases) {
					if (!Object.hasOwn(aliases, alias)) continue;
					if (!settings.aliases.has(alias)) {
						settings.aliases.set(alias, aliases[alias]);
					}
				}
				break;
			}
			case 'messages': {
				const messages = value as ClackSettings['messages'];
				if (messages?.cancel) {
					settings.messages.cancel = messages.cancel;
				}
				if (messages?.error) {
					settings.messages.error = messages.error;
				}
				break;
			}
		}
	}
}

/**
 * Check if a key is an alias for a default action
 * @param key - The raw key which might match to an action
 * @param action - The action to match
 * @returns boolean
 */
export function isActionKey(key: string | Array<string | undefined>, action: Action) {
	if (typeof key === 'string') {
		return settings.aliases.get(key) === action;
	}

	for (const value of key) {
		if (value === undefined) continue;
		if (isActionKey(value, action)) {
			return true;
		}
	}
	return false;
}
