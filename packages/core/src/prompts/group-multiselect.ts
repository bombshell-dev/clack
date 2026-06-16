import { type SeparatorOption, isSeparator } from '../utils/cursor.js';
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
	options: ((T & { group: string | boolean }) | SeparatorOption)[];
	cursor = 0;
	#selectableGroups: boolean;

	getGroupItems(group: string): (T & { group: string })[] {
		return this.options.filter((o): o is T & { group: string } => !isSeparator(o) && o.group === group);
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
		if (isSeparator(item)) {
			return;
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

	#findNextSelectable(start: number, delta: number): number {
		const len = this.options.length;
		const hasSelectable = this.options.some(
			(opt) => !isSeparator(opt) && (this.#selectableGroups || opt.group !== true)
		);
		if (!hasSelectable) return this.cursor;
		let next = start;
		for (let i = 0; i < len; i++) {
			if (!isSeparator(this.options[next]) && (this.#selectableGroups || this.options[next].group !== true)) {
				return next;
			}
			next = next + delta;
			if (next < 0) next = len - 1;
			if (next >= len) next = 0;
		}
		return start;
	}

	#moveCursor(delta: number) {
		const len = this.options.length;
		let next = this.cursor + delta;
		if (next < 0) next = len - 1;
		if (next >= len) next = 0;
		this.cursor = this.#findNextSelectable(next, delta);
	}

	constructor(opts: GroupMultiSelectOptions<T>) {
		super(opts, false);
		const { options } = opts;
		this.#selectableGroups = opts.selectableGroups !== false;
		this.options = Object.entries(options).flatMap(([key, option]) => [
			{ value: key, group: true as const, label: key },
			...option.map((opt): (T & { group: string }) | SeparatorOption =>
				isSeparator(opt) ? { ...opt } : { ...opt, group: key }
			),
		]);
		this.value = [...(opts.initialValues ?? [])];
		const initialCursor = Math.max(
			this.options.findIndex((opt) => !isSeparator(opt) && opt.value === opts.cursorAt),
			this.#selectableGroups ? 0 : 1
		);
		this.cursor = isSeparator(this.options[initialCursor])
			? this.#findNextSelectable(initialCursor, 1)
			: initialCursor;

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
