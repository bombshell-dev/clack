import { definePreset } from 'unbuild';

// @see https://github.com/unjs/unbuild
export default definePreset({
	clean: true,
	declaration: 'node16',
	sourcemap: false,
	rollup: {
		emitCJS: false,
		inlineDependencies: true,
		esbuild: {
			minifySyntax: true,
			minifyIdentifiers: true,
			minifyWhitespace: false,
		},
	},
});
