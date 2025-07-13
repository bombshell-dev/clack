import { Confirm, type ConfirmProps } from './components/confirm.js';
import { Field, type FieldProps } from './components/field.js';
import { Form, type FormProps } from './components/form.js';
import { Note, type NoteProps } from './components/note.js';
import { Option, type OptionProps } from './components/option.js';
import { Password, type PasswordProps } from './components/password.js';
import { Select, type SelectProps } from './components/select.js';
import { Text, type TextProps } from './components/text.js';
import type { JSX, RenderFunction, RenderOptions } from './types.js';

export type { JSX };
export {
	Confirm,
	type ConfirmProps,
	Note,
	type NoteProps,
	Text,
	type TextProps,
	Password,
	type PasswordProps,
	Option,
	type OptionProps,
	Select,
	type SelectProps,
	Field,
	type FieldProps,
	Form,
	type FormProps,
};

export function Fragment(props: { children: JSX.Element | JSX.Element[] }): JSX.Element {
	return {
		render: () => Promise.resolve(props.children),
	};
}

export type Component =
	| typeof Confirm
	| typeof Note
	| typeof Text
	| typeof Password
	| typeof Option
	| typeof Select;

function jsx<T extends keyof JSX.IntrinsicElements>(
	tag: T,
	props: JSX.IntrinsicElements[T],
	_key?: string
): JSX.Element;
function jsx<T extends Component>(fn: T, props: Parameters<T>[0], _key?: string): JSX.Element;
function jsx(tagOrFn: string | Component, props: unknown, _key?: string): JSX.Element {
	let render: RenderFunction;
	if (typeof tagOrFn === 'function') {
		const renderFn = (tagOrFn as (props: unknown) => JSX.Element)(props);
		render = (options) => renderFn.render(options);
	} else {
		render = () => Promise.resolve(null);
	}
	return {
		render,
	};
}

export { jsx };
export const jsxDEV = jsx;

export async function render(node: JSX.Element, options?: RenderOptions): Promise<void> {
	await node.render(options);
}
