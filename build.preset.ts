import { definePreset } from 'unbuild';

// @see https://github.com/unjs/unbuild
export default definePreset({
	clean: true,
	declaration: true,
	sourcemap: true,
	rollup: {
		emitCJS: true,
		inlineDependencies: true,
		esbuild: {
			minify: true,
		},
		dts: {
			// rollup-plugin-dts doesnt forward tsconfig's "include"
			// field to tsc, which prompts tsc to incorrectly believe
			// that the "composite" constraints are unmet.
			compilerOptions: { composite: false }
		}
	},
});
