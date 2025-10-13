import type { Writable } from 'node:stream';
import { wrapAnsi } from 'fast-wrap-ansi';
import { cursor, erase } from 'sisteransi';
import { getColumns } from './utils/index.js';

export abstract class Component {
	#lastFrame?: string;
	#output: Writable;
	#active = false;

	constructor(output: Writable = process.stdout) {
		this.#output = output;
	}

	public abstract render(): Template;

	public onMount(): void {
		return;
	}

	public onUnmount(): void {
		return;
	}

	#renderDiff(from: string | undefined, to: string): void {
		const output = this.#output;
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
				// do nothing
			} else if (toLine === undefined) {
				output.write(erase.line);
			} else {
				output.write(`${toLine}\n`);
			}

			if (i < fromLineCount - 1) {
				output.write(cursor.down(1));
			}
		}

		output.write(cursor.show);
	}

	#render(): string {
		const template = this.render();

		if (typeof template === 'string') {
			return template;
		}

		let result = '';

		for (const part of template) {
			if (typeof part === 'string') {
				result += part;
			} else if (part instanceof Component) {
				this.#children.add(part);
				result += part.#render();
			}
		}

		return result;
	}

	#children: Set<Component> = new Set();

	public requestUpdate(): void {
		if (!this.#active) {
			this.#active = true;
			this.onMount();
		}

		const frame = this.#render();
		const wrapped = wrapAnsi(frame, getColumns(this.#output), {
			hard: true,
			trim: false,
		});

		if (wrapped === this.#lastFrame) {
			return;
		}

		this.#renderDiff(this.#lastFrame, wrapped);

		this.#lastFrame = wrapped;
	}

	public unmount(): void {
		if (!this.#active) {
			return;
		}
		this.#active = false;
		this.onUnmount();
	}
}

export const term = (strings: TemplateStringsArray, ...values: unknown[]): TemplateArray => {
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

	render(): Template {
		if (this.#position === 10) {
			this.#position--;
		} else {
			this.#position++;
		}
		return term`${' '.repeat(this.#position)}(͡° ͜ʖ ͡°)`;
	}
}

export class SecondsComponent extends Component {
	#seconds = 0;
	#timer?: ReturnType<typeof setInterval>;
	#smileComponent = new SmileComponent();

	override onMount() {
		this.#timer = setInterval(() => {
			this.#seconds++;
			this.requestUpdate();
		}, 1000);
	}

	override onUnmount() {
		if (this.#timer) {
			clearInterval(this.#timer);
			this.#timer = undefined;
		}
	}

	render(): Template {
		return term`| Seconds elapsed:
| ${this.#seconds}
| Press Ctrl+C to exit
| <-- ${this.#smileComponent} -->
`;
	}
}
