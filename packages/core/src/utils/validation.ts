import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Represents the `validate()` option. A function or a
 * [Standard Schema](https://github.com/standard-schema/standard-schema)
 * that validates user input. Return a `string` or `Error` to show as a
 * validation error, or `undefined` to accept the result.
 */
export type Validate<TValue> =
	| ((value: TValue | undefined) => string | Error | undefined)
	| StandardSchemaV1<TValue | undefined, any>;

/**
 * Runs the `validate()` option and normalizes the result
 * @param validate - The validate option
 * @param value - The user input
 * @returns string | Error | undefined
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
				'Schema validation must be synchronous. Update `validate()` and get rid of any asynchronous logic.'
			);
		}
		return result.issues?.at(0)?.message;
	}
	return validate(value);
}
