import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Prompt, { PromptOptions } from './prompt';

interface PathNode {
	name: string;
	children: PathNode[] | undefined;
}

interface PathOptions extends PromptOptions<PathPrompt> {
	onlyShowDir?: boolean;
}

export default class PathPrompt extends Prompt {
	private cursorMap: number[];
	private onlyShowDir: boolean;
	public root: PathNode;

	public get option() {
		let aux: PathNode = this.root;
		for (const index of this.cursorMap) {
			if (aux.children && aux.children[index]) {
				aux = aux.children[index];
			}
		}
		return {
			index: this.cursorMap[this.cursorMap.length - 1] ?? 0,
			depth: this.cursorMap.length,
			node: aux,
		};
	}

	public get options(): PathNode[] {
		let aux: PathNode = this.root;
		let options: PathNode[] = [this.root];
		for (const index of this.cursorMap) {
			options = options.concat(aux.children ?? []);
			if (aux.children && aux.children[index]) {
				aux = aux.children[index];
			}
		}
		return options;
	}

	public get cursor(): number {
		return this.cursorMap.reduce((a, b) => a + b + 1, 0);
	}

	private get _node(): PathNode[] {
		let aux: PathNode = this.root;
		let options: PathNode[] = [];
		for (const index of this.cursorMap) {
			if (aux.children?.[index]) {
				options = aux.children;
				aux = aux.children[index];
			} else {
				break;
			}
		}
		return options;
	}

	private get _value(): string {
		const value: string[] = [];
		let option: PathNode = this.root;
		for (const index of this.cursorMap) {
			if (option.children?.[index]) {
				option = option.children[index];
				value.push(option.name);
			}
		}
		return resolve(this.root.name, ...value);
	}

	private _changeValue() {
		this.value = this._value;
	}

	private mapDir(path: string): PathNode[] {
		return readdirSync(path, { withFileTypes: true })
			.map((item) => ({
				name: item.name,
				children: item.isDirectory() ? [] : undefined,
			}))
			.filter((node) => {
				return this.onlyShowDir ? !!node.children : true;
			});
	}

	constructor(opts: PathOptions) {
		super(opts, false);

		this.onlyShowDir = opts.onlyShowDir ?? false;
		const cwd = opts.initialValue ?? process.cwd();
		this.root = {
			name: cwd,
			children: this.mapDir(cwd),
		};
		this.cursorMap = [0];
		this._changeValue();

		this.on('cursor', (key) => {
			switch (key) {
				case 'up':
					if (this.cursorMap.length) {
						this.cursorMap = [
							...this.cursorMap.slice(0, -1),
							this.option.index > 0 ? this.option.index - 1 : this._node.length - 1,
						];
					}
					break;
				case 'down':
					if (this.cursorMap.length) {
						this.cursorMap = [
							...this.cursorMap.slice(0, -1),
							this.option.index < this._node.length - 1 ? this.option.index + 1 : 0,
						];
					}
					break;
				case 'right':
					if (this.option.node.children) {
						const children = this.mapDir(this._value);
						this.option.node.children = children;
						this.cursorMap = children.length ? [...this.cursorMap, 0] : this.cursorMap;
					}
					break;
				case 'left':
					const prevCursor = this.cursorMap;
					this.cursorMap = this.cursorMap.slice(0, -1);
					if (this.option.node.children?.length && this.cursorMap.length) {
						this.option.node.children = [];
					} else if (prevCursor.length === 0) {
						const cwd = resolve(this.root.name, '..');
						this.root = {
							name: cwd,
							children: this.mapDir(cwd),
						};
					}
					break;
			}
			this._changeValue();
		});
	}
}
