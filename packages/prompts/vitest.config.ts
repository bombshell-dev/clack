import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		snapshotSerializers: ['vitest-ansi-serializer'],
	},
});
