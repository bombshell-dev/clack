export type Primitive = Readonly<string | boolean | number>;

export type Option<Value> = Value extends Primitive
	? { value: Value; label?: string; hint?: string }
	: { value: Value; label: string; hint?: string };
