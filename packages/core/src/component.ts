import type { Writable } from 'node:stream';
import { wrapAnsi } from 'fast-wrap-ansi';
import { cursor, erase } from 'sisteransi';
import { getColumns } from './utils/index.js';

function renderAsString(template: Template, host?: Component): string {
	if (typeof template === 'string') {
		return template;
	}

	let result = '';

	for (const part of template) {
		if (typeof part === 'string') {
			result += part;
		} else if (part instanceof Component) {
			if (host) {
				host.children.add(part);
			}
			result += renderAsString(part.render(), part);
		}
	}

	return result;
}

function renderDiff(from: string | undefined, to: string, output: Writable): void {
	const fromLines = from ? from.split('\n') : [];
	const toLines = to.split('\n');
	const fromLineCount = fromLines.length;
	const toLineCount = toLines.length;
	const maxLines = Math.max(fromLineCount, toLineCount);

	output.write(cursor.hide);
	output.write(cursor.left);

	if (fromLineCount > 0) {
		output.write(cursor.up(fromLineCount));
	}

	for (let i = 0; i < maxLines; i++) {
		const fromLine = fromLines[i];
		const toLine = toLines[i];

		if (fromLine === toLine) {
			output.write(cursor.down(1));
		} else {
			output.write(erase.line);
			if (toLine !== undefined) {
				output.write(`${toLine}\n`);
			} else {
				output.write(cursor.down(1));
			}
		}
	}

	output.write(cursor.show);
}

function render(
	template: Template,
	output: Writable,
	lastFrame: string | undefined,
	host?: Component
): string {
	const frame = renderAsString(template, host);
	const wrapped = wrapAnsi(frame, getColumns(output), {
		hard: true,
		trim: false,
	});

	if (wrapped === lastFrame) {
		return lastFrame;
	}

	renderDiff(lastFrame, wrapped, output);

	return wrapped;
}

export abstract class Component {
	public children: Set<Component> = new Set();
	public host?: Component;

	constructor(host: Component | undefined) {
		this.host = host;
	}

	public abstract render(): Template;

	public onMount(): void {
		for (const child of this.children) {
			child.onMount();
		}
	}

	public onUnmount(): void {
		for (const child of this.children) {
			child.onUnmount();
		}
	}

	public requestUpdate(): void {
		if (this.host) {
			this.host.requestUpdate();
		}
	}
}

export class Renderer extends Component {
	#output: Writable;
	#lastFrame: string | undefined;
	#root?: Component;

	constructor(output: Writable = process.stdout) {
		super(undefined);
		this.#output = output;
	}

	render(): Template {
		const result: TemplateArray = [];
		for (const child of this.children) {
			const childResult = child.render();
			if (typeof childResult === 'string') {
				result.push(childResult);
			} else {
				for (const part of childResult) {
					result.push(part);
				}
			}
		}
		return result;
	}

	mount(comp: Component): void {
		this.#root = comp;
		this.children.add(comp);
		comp.host = this;
		this.requestUpdate();
		this.onMount();
	}

	requestUpdate() {
		this.#lastFrame = render(this.render(), this.#output, this.#lastFrame, this.#root);
	}

	unmount() {
		this.#lastFrame = undefined;
		this.onUnmount();
	}
}

export const term = (strings: TemplateStringsArray, ...values: unknown[]): Template => {
	const result: TemplateArray = [];

	for (let i = 0; i < strings.length; i++) {
		result.push(strings[i]);
		const value = values[i];
		if (value !== undefined) {
			if (value instanceof Component) {
				result.push(value);
			} else {
				result.push(String(value));
			}
		}
	}

	return result;
};

type TemplateArray = Array<string | Component>;

type Template = string | TemplateArray;

export class SmileComponent extends Component {
	#position: number = 0;
	#direction: -1 | 1 = 1;
	#timer?: ReturnType<typeof setInterval>;

	override onMount() {
		super.onMount();
		this.#timer = setInterval(() => {
			this.#updatePosition();
			this.requestUpdate();
		}, 100);
	}

	override onUnmount() {
		super.onUnmount();
		if (this.#timer) {
			clearInterval(this.#timer);
			this.#timer = undefined;
		}
	}

	#updatePosition() {
		if (this.#direction === 1) {
			this.#position++;
			if (this.#position === 10) {
				this.#direction = -1;
			}
		} else {
			this.#position--;
			if (this.#position === 0) {
				this.#direction = 1;
			}
		}
	}

	render(): Template {
		return term`${' '.repeat(this.#position)}💣 𝐂𝐋𝐀𝐂𝐊`;
	}
}

export class SecondsComponent extends Component {
	#seconds = 0;
	#timer?: ReturnType<typeof setInterval>;
	#smileComponent = new SmileComponent(this);

	override onMount() {
		super.onMount();
		this.#timer = setInterval(() => {
			this.#seconds++;
			this.requestUpdate();
		}, 1000);
	}

	override onUnmount() {
		super.onUnmount();
		if (this.#timer) {
			clearInterval(this.#timer);
			this.#timer = undefined;
		}
	}

	render(): Template {
		return term`| Seconds elapsed:
| ${this.#seconds}
| Press Ctrl+C to exit
| ${this.#smileComponent}
`;
	}
}
