import type { StandardSchemaV1 } from './standard-schema.js';

/**
 * A function or [Standard Schema](https://github.com/standard-schema/standard-schema)
 * that validates user input. If a custom function is given, you should return a
 * `string` or `Error` to show as a validation error, or `undefined` to accept the result.
 *
 * @example Using arktype
 * ```ts
 * import { text } from '@clack/prompts';
 * import { type } from 'arktype';
 *
 * const name = await text({
 *   message: 'Enter your name (letters only)',
 *   validate: type('string.alpha').describe('Name can only contain letters'),
 * });
 * ```
 *
 * @example Custom validator
 * ```ts
 * import { text } from '@clack/prompts';
 *
 * const age = await text({
 *   message: 'Enter your age:',
 *   validate(value) {
 *     if (!value) return 'Please enter a value';
 *     const num = parseInt(value);
 *     if (isNaN(num)) return 'Please enter a valid number';
 *     if (num < 0 || num > 120) return 'Age must be between 0 and 120';
 *     return undefined;
 *   },
 * });
 * ```
 */
export type Validate<TValue> =
	| ((value: TValue | undefined) => string | Error | undefined)
	| StandardSchemaV1<TValue | undefined, unknown>;

/**
 * Runs the `validate()` option and normalizes the result
 * @param validate - The validate option
 * @param value - The user input
 * @returns the validation result
 */
export function runValidation<TValue>(
	validate: Validate<TValue>,
	value: TValue | undefined
): string | Error | undefined {
	if ('~standard' in validate) {
		const result = validate['~standard'].validate(value);
		// https://standardschema.dev/schema#how-to-only-allow-synchronous-validation
		// TODO: https://github.com/bombshell-dev/clack/issues/92
		if (result instanceof Promise) {
			throw new TypeError(
				'Schema validation must be synchronous. Update `validate()` and remove any asynchronous logic.'
			);
		}
		return result.issues?.at(0)?.message;
	}
	return validate(value);
}
