import type { Key } from 'node:readline';

const actions = ['up', 'down', 'left', 'right', 'space', 'enter', 'cancel'] as const;
export type Action = (typeof actions)[number];

const DEFAULT_MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
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
			required: string;
			invalidDay: (days: number, month: string) => string;
			afterMin: (min: Date) => string;
			beforeMax: (max: Date) => string;
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
		// emacs support
		['\x10', 'up'], // ctrl+p
		['\x0e', 'down'], // ctrl+n
		// opinionated defaults!
		['\x03', 'cancel'], // ctrl+c
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
			required: 'Please enter a valid date',
			invalidMonth: 'There are only 12 months in a year',
			invalidDay: (days, month) => `There are only ${days} days in ${month}`,
			afterMin: (min) => `Date must be on or after ${min.toISOString().slice(0, 10)}`,
			beforeMax: (max) => `Date must be on or before ${max.toISOString().slice(0, 10)}`,
		},
	},
};

export interface ClackSettings {
	/**
	 * Set custom global aliases for the default actions.
	 * This will not overwrite existing aliases, it will only add new ones!
	 *
	 * @param aliases - An object that maps aliases to actions
	 * @default { k: 'up', j: 'down', h: 'left', l: 'right', '\x10': 'up', '\x0e': 'down', '\x03': 'cancel', 'escape': 'cancel' }
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
			/** Shown when date is missing */
			required?: string;
			/** Shown when month > 12 */
			invalidMonth?: string;
			/** (days, monthName) => message for invalid day */
			invalidDay?: (days: number, month: string) => string;
			/** (min) => message when date is before minDate */
			afterMin?: (min: Date) => string;
			/** (max) => message when date is after maxDate */
			beforeMax?: (max: Date) => string;
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
			if (date.messages.required !== undefined) {
				settings.date.messages.required = date.messages.required;
			}
			if (date.messages.invalidMonth !== undefined) {
				settings.date.messages.invalidMonth = date.messages.invalidMonth;
			}
			if (date.messages.invalidDay !== undefined) {
				settings.date.messages.invalidDay = date.messages.invalidDay;
			}
			if (date.messages.afterMin !== undefined) {
				settings.date.messages.afterMin = date.messages.afterMin;
			}
			if (date.messages.beforeMax !== undefined) {
				settings.date.messages.beforeMax = date.messages.beforeMax;
			}
		}
	}
}

/**
 * Get the action aliased by a control-key chord (e.g. ctrl+n -> 'down').
 * Control chords arrive as raw bytes in `char`/`key.sequence`, so they can alias
 * actions without clashing with typed input the way plain-letter aliases would.
 * @param char - The raw character emitted alongside the keypress
 * @param key - The parsed key
 * @returns the aliased action, or undefined when the key is not an aliased control chord
 */
export function getActionForControlKey(char: string | undefined, key: Key): Action | undefined {
	if (!key.ctrl) {
		return undefined;
	}
	return getActionForKey([char, key.sequence]);
}

/**
 * Get the action aliased by a key, checking every representation of the key
 * @param key - The raw key representations which might match to an action
 * @returns the aliased action, or undefined when none matches
 */
export function getActionForKey(key: Array<string | undefined>): Action | undefined {
	for (const value of key) {
		if (value === undefined) continue;
		const action = settings.aliases.get(value);
		if (action !== undefined) {
			return action;
		}
	}
	return undefined;
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
