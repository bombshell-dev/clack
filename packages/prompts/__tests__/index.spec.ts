import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as packageExports from '../src/index';

function camelCase(input: string): string {
	if (input === 'multi-select') {
		return input.replace(/-/g, '');
	}
	return input.replace(/[-_]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
}

describe('Package', () => {
	it('should export all prompts', async () => {
		const exportedPrompts = Object.keys(packageExports);
		const promptsPath = join(__dirname, '../src/prompts');
		const promptFiles = readdirSync(promptsPath);

		expect.assertions(promptFiles.length);
		for (const file of promptFiles) {
			const prompt = await import(join(promptsPath, file));
			expect(exportedPrompts).toContain(camelCase(prompt.default.name));
		}
	});

	it('should export selected utils', async () => {
		const exportedUtils = Object.keys(packageExports);
		const utils: string[] = ['isCancel', 'mockPrompt', 'setGlobalAliases'];

		expect.assertions(utils.length);
		for (const util of utils) {
			expect(exportedUtils).toContain(util);
		}
	});
});
