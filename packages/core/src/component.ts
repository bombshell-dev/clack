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

	if (fromLineCount > 0) {
		output.write(cursor.left);
		output.write(cursor.up(fromLineCount));
	}

	for (let i = 0; i < toLineCount; i++) {
		const fromLine = fromLines[i];
		const toLine = toLines[i];
		const nextFromLine = fromLines[i + 1];

		if (fromLine === toLine) {
			output.write(cursor.down(1));
		} else {
			if (fromLine !== undefined) {
				output.write(erase.line);
			}
			if (toLine !== undefined) {
				output.write(toLine);
			}
			if (i < toLineCount - 1 && nextFromLine === undefined) {
				output.write('\n');
			} else {
				output.write(cursor.left);
				output.write(cursor.down(1));
			}
		}
	}

	if (fromLineCount > toLineCount) {
		output.write(erase.down());
	}
}

function renderToOutput(
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

export class RenderHost extends Component {
	#lastFrame: string | undefined;
	#output: Writable;
	#root?: Component;
	#mounted: boolean = false;

	constructor(output: Writable = process.stdout) {
		super(undefined);
		this.#output = output;
	}

	#onResize = (): void => {
		this.requestUpdate();
	};

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

	requestUpdate() {
		this.#lastFrame = renderToOutput(this.render(), this.#output, this.#lastFrame, this.#root);
		if (!this.#mounted) {
			this.#mounted = true;
			this.onMount();
		}
	}

	onUnmount(): void {
		super.onUnmount();
		this.#lastFrame = undefined;
		this.#mounted = false;
		this.#output.off('resize', this.#onResize);
		this.#output.write(cursor.show);
	}

	onMount(): void {
		super.onMount();
		this.#output.write(cursor.hide);
		this.#output.on('resize', this.#onResize);
	}

	attach(component: Component): void {
		component.host = this;
		this.#root = component;
		this.children.add(component);
	}
}

export function render(component: Component, output: Writable = process.stdout): () => void {
	const host = new RenderHost(output);

	host.attach(component);
	host.requestUpdate();

	return () => {
		host.onUnmount();
	};
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
