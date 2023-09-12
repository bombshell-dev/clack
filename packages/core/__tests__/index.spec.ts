import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as packageExports from '../src/index';

describe('Package', () => {
	it('should export all prompts', async () => {
		const exportedPrompts = Object.keys(packageExports).filter(
			(key) => /prompt/i.test(key) && !/^mock/.test(key)
		);
		const promptsPath = join(__dirname, '../src/prompts');
		const promptFiles = readdirSync(promptsPath);

		expect.assertions(promptFiles.length + 1);
		for (const file of promptFiles) {
			const prompt = await import(join(promptsPath, file));
			expect(exportedPrompts).toContain(prompt.default.name);
		}
		expect(exportedPrompts).toHaveLength(promptFiles.length);
	});

	it('should export selected utils', async () => {
		const exportedUtils = Object.keys(packageExports).filter(
			(key) => !/prompt/i.test(key) || /^mock/.test(key)
		);
		const utils: string[] = ['block', 'isCancel', 'mockPrompt', 'setGlobalAliases'];

		expect.assertions(utils.length + 1);
		for (const util of utils) {
			expect(exportedUtils).toContain(util);
		}
		expect(exportedUtils).toHaveLength(utils.length);
	});
});
