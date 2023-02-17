import { definePreset } from 'unbuild';

// @see https://github.com/unjs/unbuild
export default definePreset({
	clean: true,
	declaration: true,
	rollup: {
		emitCJS: true,
		inlineDependencies: true,
		esbuild: {
			minify: true,
			sourceMap: true,
		},
	},
});
