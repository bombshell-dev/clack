import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	preset: '../../build.preset',
	entries: ['src/index'],
});
