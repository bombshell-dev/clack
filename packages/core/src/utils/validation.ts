import type { StandardSchemaV1 } from '@standard-schema/spec';

export type Validate<TValue> =
	| ((value: TValue | undefined) => string | Error | undefined)
	| StandardSchemaV1<TValue | undefined, any>;

export function runValidation<TValue>(
	validate: Validate<TValue>,
	value: TValue | undefined
): string | Error | undefined {
	if ('~standard' in validate) {
		const result = validate['~standard'].validate(value);
		// https://standardschema.dev/schema#how-to-only-allow-synchronous-validation
		if (result instanceof Promise) {
			throw new TypeError(
				'Schema validation must be synchronous. Update `validate()` and get rid of any asynchronous logic.'
			);
		}
		return result.issues?.at(0)?.message;
	}
	return validate(value);
}
