const actions = ['up', 'down', 'left', 'right', 'space', 'enter', 'cancel'] as const;
export type Action = (typeof actions)[number];

/** Global settings for Clack programs, stored in memory */
interface InternalClackSettings {
	actions: Set<Action>;
	aliases: Map<string, Action>;
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
};

export interface ClackSettings {
	/**
	 * Set custom global aliases for the default actions.
	 * This will not overwrite existing aliases, it will only add new ones!
	 *
	 * @param aliases - An object that maps aliases to actions
	 * @default { k: 'up', j: 'down', h: 'left', l: 'right', '\x03': 'cancel', 'escape': 'cancel' }
	 */
	aliases: Record<string, Action>;
}

export function updateSettings(updates: ClackSettings) {
	for (const _key in updates) {
		const key = _key as keyof ClackSettings;
		if (!Object.hasOwn(updates, key)) continue;
		const value = updates[key];

		switch (key) {
			case 'aliases': {
				for (const alias in value) {
					if (!Object.hasOwn(value, alias)) continue;
					if (!settings.aliases.has(alias)) {
						settings.aliases.set(alias, value[alias]);
					}
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
