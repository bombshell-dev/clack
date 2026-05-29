import { isSeparator } from '../utils/cursor.js';
import Prompt, { type PromptOptions } from './prompt.js';

export interface GroupMultiSelectOptions<T extends { value: any }>
	extends PromptOptions<T['value'][], GroupMultiSelectPrompt<T>> {
	options: Record<string, T[]>;
	initialValues?: T['value'][];
	required?: boolean;
	cursorAt?: T['value'];
	selectableGroups?: boolean;
}
export default class GroupMultiSelectPrompt<T extends { value: any }> extends Prompt<T['value'][]> {
	options: (T & { group: string | boolean })[];
	cursor = 0;
	#selectableGroups: boolean;

	getGroupItems(group: string): T[] {
		return this.options.filter((o) => o.group === group);
	}

	isGroupSelected(group: string) {
		const items = this.getGroupItems(group);
		const value = this.value;
		if (value === undefined) {
			return false;
		}
		return items.every((i) => value.includes(i.value));
	}

	private toggleValue() {
		const item = this.options[this.cursor];
		if (this.value === undefined) {
			this.value = [];
		}
		if (item.group === true) {
			const group = item.value;
			const groupedItems = this.getGroupItems(group);
			if (this.isGroupSelected(group)) {
				this.value = this.value.filter(
					(v: string) => groupedItems.findIndex((i) => i.value === v) === -1
				);
			} else {
				this.value = [...this.value, ...groupedItems.map((i) => i.value)];
			}
			this.value = Array.from(new Set(this.value));
		} else {
			const selected = this.value.includes(item.value);
			this.value = selected
				? this.value.filter((v: T['value']) => v !== item.value)
				: [...this.value, item.value];
		}
	}

	#moveCursor(delta: number) {
		const len = this.options.length;
		let next = this.cursor;
		for (let i = 0; i < len; i++) {
			next = next + delta;
			if (next < 0) next = len - 1;
			if (next >= len) next = 0;
			const opt = this.options[next];
			if (isSeparator(opt)) continue;
			if (opt.group === true && !this.#selectableGroups) continue;
			break;
		}
		this.cursor = next;
	}

	constructor(opts: GroupMultiSelectOptions<T>) {
		super(opts, false);
		const { options } = opts;
		this.#selectableGroups = opts.selectableGroups !== false;
		this.options = Object.entries(options).flatMap(([key, option]) => [
			{ value: key, group: true, label: key },
			...option.map((opt) => ({ ...opt, group: key })),
		]) as any;
		this.value = [...(opts.initialValues ?? [])];
		this.cursor = Math.max(
			this.options.findIndex((opt) => !isSeparator(opt) && opt.value === opts.cursorAt),
			this.#selectableGroups ? 0 : 1
		);

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
				case 'up':
					this.#moveCursor(-1);
					break;
				case 'down':
				case 'right':
					this.#moveCursor(1);
					break;
				case 'space':
					this.toggleValue();
					break;
			}
		});
	}
}
