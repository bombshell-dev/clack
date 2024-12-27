import { type BuildConfig, defineBuildConfig } from 'unbuild';

// @see https://github.com/unjs/unbuild
const config: BuildConfig[] = defineBuildConfig({
	preset: '../../build.preset',
	entries: ['src/index'],
});

export default config;
