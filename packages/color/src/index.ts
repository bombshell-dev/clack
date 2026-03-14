import { type InspectColor, styleText } from 'node:util';

export type StyleText = ((text: string | TemplateStringsArray, ...args: unknown[]) => string) & {
	[key in InspectColor]: StyleText;
};

export function createStyleText(...styles: InspectColor[]): StyleText {
	return new Proxy(
		(text: string | TemplateStringsArray, ...args: unknown[]) =>
			styleText(styles, typeof text === 'string' ? text : String.raw({ raw: text }, ...args)),
		{
			get(_, prop) {
				if (typeof prop !== 'string') throw new TypeError('Property must be a string');
				return createStyleText(...styles, prop as InspectColor);
			},
		}
	) as StyleText;
}

export default createStyleText();
