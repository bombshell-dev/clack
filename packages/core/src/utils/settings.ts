const actions = ['up', 'down', 'left', 'right', 'space', 'enter', 'cancel'] as const;
export type Action = (typeof actions)[number];

const DEFAULT_MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
];

/** Global settings for Clack programs, stored in memory */
interface InternalClackSettings {
	actions: Set<Action>;
	aliases: Map<string, Action>;
	messages: {
		cancel: string;
		error: string;
	};
	withGuide: boolean;
	date: {
		monthNames: string[];
		messages: {
			invalidMonth: string;
			invalidDay: (days: number, month: string) => string;
		};
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
	withGuide: true,
	date: {
		monthNames: [...DEFAULT_MONTH_NAMES],
		messages: {
			invalidMonth: 'There are only 12 months in a year',
			invalidDay: (days, month) => `There are only ${days} days in ${month}`,
		},
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

	withGuide?: boolean;

	/**
	 * Date prompt localization
	 */
	date?: {
		/** Month names for validation messages (January, February, ...) */
		monthNames?: string[];
		messages?: {
			/** Shown when month > 12 */
			invalidMonth?: string;
			/** (days, monthName) => message for invalid day */
			invalidDay?: (days: number, month: string) => string;
		};
	};
}

export function updateSettings(updates: ClackSettings) {
	// Handle each property in the updates
	if (updates.aliases !== undefined) {
		const aliases = updates.aliases;
		for (const alias in aliases) {
			if (!Object.hasOwn(aliases, alias)) continue;

			const action = aliases[alias];
			if (!settings.actions.has(action)) continue;

			if (!settings.aliases.has(alias)) {
				settings.aliases.set(alias, action);
			}
		}
	}

	if (updates.messages !== undefined) {
		const messages = updates.messages;
		if (messages.cancel !== undefined) {
			settings.messages.cancel = messages.cancel;
		}
		if (messages.error !== undefined) {
			settings.messages.error = messages.error;
		}
	}

	if (updates.withGuide !== undefined) {
		settings.withGuide = updates.withGuide !== false;
	}

	if (updates.date !== undefined) {
		const date = updates.date;
		if (date.monthNames !== undefined) {
			settings.date.monthNames = [...date.monthNames];
		}
		if (date.messages !== undefined) {
			if (date.messages.invalidMonth !== undefined) {
				settings.date.messages.invalidMonth = date.messages.invalidMonth;
			}
			if (date.messages.invalidDay !== undefined) {
				settings.date.messages.invalidDay = date.messages.invalidDay;
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
