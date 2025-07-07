import { text, type TextOptions } from './text.js';

export interface NumberOptions extends TextOptions {
	placeholder?: number;
	defaultValue?: number;
	initialValue?: number;
	validate?: (value: number | undefined) => string | Error | undefined;
}

export const number = (opts: NumberOptions) => {
	const nanFallback = (value: any): any => (value === null || isNaN(Number(value)) ? '' : value);
	return text({
		...opts,
		placeholder: String(nanFallback(opts.placeholder)),
		defaultValue: String(nanFallback(opts.defaultValue)),
		initialValue: String(nanFallback(opts.initialValue)),
		validate(value) {
			if (value.length > 0 && !/^[-+]?[0-9]+((\.)|(\.[0-9]+))?$/.test(value)) {
				return 'Please input a valid number value';
			}
			if (opts.validate) {
				return opts.validate(Number(value));
			}
			return undefined;
		},
	}).then((value) => (typeof value !== 'string' ? value : Number(value)));
};
