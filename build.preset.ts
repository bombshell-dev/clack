import { definePreset } from 'unbuild';

// @see https://github.com/unjs/unbuild
export default definePreset({
	clean: true,
	declaration: 'node16',
	sourcemap: true,
	rollup: {
		emitCJS: false,
		inlineDependencies: true,
		esbuild: {
			minify: true,
		},
	},
});
