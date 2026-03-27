import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: ['dist/**', 'node_modules/**'],
		env: {
			FORCE_COLOR: '1',
		},
		snapshotSerializers: ['vitest-ansi-serializer'],
	},
});
