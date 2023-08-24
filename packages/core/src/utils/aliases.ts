
export type InferSetType<T> = T extends Set<infer U> ? U : never;

const DEFAULT_KEYS = ['up', 'down', 'left', 'right', 'space', 'enter', 'cancel'] as const;
export const keys = new Set(DEFAULT_KEYS);

export const aliases = new Map<string, InferSetType<typeof keys>>([
	['k', 'up'],
	['j', 'down'],
	['h', 'left'],
	['l', 'right'],
	['\x03', 'cancel'],
]);

/**
 * Set custom global aliases for the default keys - This will not overwrite existing aliases just add new ones
 *
 * @param aliases - A map of aliases to keys
 * @default
 * new Map([['k', 'up'], ['j', 'down'], ['h', 'left'], ['l', 'right'], ['\x03', 'cancel'],])
 */
export function setGlobalAliases(alias: Array<[string, InferSetType<typeof keys>]>) {
	for (const [newAlias, key] of alias) {
		if (!aliases.has(newAlias)) {
			aliases.set(newAlias, key);
		}
	}
}

/**
 * Check if a key is an alias for a default key
 * @param key - The key to check for
 * @param type - The type of key to check for
 * @returns boolean
 */
export function hasAliasKey(key: string | Array<string | undefined>, type: InferSetType<typeof keys>) {
	if (typeof key === 'string') {
		return aliases.has(key) && aliases.get(key) === type;
	}

	return key.map((n) => {
		if (n !== undefined && aliases.has(n) && aliases.get(n) === type) return true;
		return false;
	}).includes(true);
}
