import { type BuildConfig, defineBuildConfig } from 'unbuild';

const config: BuildConfig[] = defineBuildConfig({
	preset: '../../build.preset',
	entries: ['src/index'],
});

export default config;
