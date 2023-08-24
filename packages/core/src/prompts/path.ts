import { readdirSync } from 'node:fs';
import Prompt, { PromptOptions } from './prompt';
import { resolve } from 'node:path';

interface PathNode {
	name: string;
	children: PathNode[] | undefined;
}

interface PathOptions extends PromptOptions<PathPrompt> {}
export default class PathPrompt extends Prompt {
	private cursor: number[];
	root: PathNode;

	private get _node(): PathNode[] {
		let aux: PathNode = this.root;
		let options: PathNode[] = [];
		for (const index of this.cursor) {
			if (aux.children?.[index]) {
				options = aux.children;
				aux = aux.children[index];
			} else {
				break;
			}
		}
		return options;
	}

	get _option() {
		let aux: PathNode = this.root;
		for (let i = 0; i < this.cursor.length; i++) {
			if (aux.children && aux.children[this.cursor[i]]) {
				aux = aux.children[this.cursor[i]];
			} else {
				break;
			}
		}
		return {
			index: this.cursor[this.cursor.length - 1] ?? 0,
			depth: this.cursor.length,
			node: aux,
		};
	}

	private get _value(): string {
		const value: string[] = [];
		let option: PathNode = this.root;
		for (const index of this.cursor) {
			if (option.children?.[index]) {
				option = option.children[index];
				value.push(option.name);
			}
		}
		return resolve(this.root.name, ...value);
	}

	private changeValue() {
		this.value = this._value;
	}

	private mapDir(path: string): PathNode[] {
		return readdirSync(path, { withFileTypes: true }).map((item) => ({
			name: item.name,
			children: item.isDirectory() ? [] : undefined,
		}));
	}

	constructor(opts: PathOptions) {
		super(opts, false);
		const cwd = opts.initialValue ?? process.cwd();
		this.root = {
			name: cwd,
			children: this.mapDir(cwd),
		};
		this.cursor = [0];
		this.changeValue();

		this.on('cursor', (key) => {
			switch (key) {
				case 'up':
					if (this.cursor.length) {
						this.cursor = [
							...this.cursor.slice(0, -1),
							this._option.index > 0 ? this._option.index - 1 : this._node.length - 1,
						];
					}
					break;
				case 'down':
					if (this.cursor.length) {
						this.cursor = [
							...this.cursor.slice(0, -1),
							this._option.index < this._node.length - 1 ? this._option.index + 1 : 0,
						];
					}
					break;
				case 'right':
					if (this._option.node.children) {
						this._option.node.children = this.mapDir(this._value);
						this.cursor = [...this.cursor, 0];
						this.emit('resize');
					}
					break;
				case 'left':
          const prevCursor = this.cursor
					this.cursor = this.cursor.slice(0, -1);
					if (this._option.node.children?.length && this.cursor.length) {
						this._option.node.children = [];
						this.emit('resize');
					} else if (prevCursor.length === 0) {
						const cwd = resolve(this.root.name, '..');
						this.root = {
							name: cwd,
							children: this.mapDir(cwd),
						};
						this.emit('resize');
					}
					break;
			}
			this.changeValue();
		});
	}
}
