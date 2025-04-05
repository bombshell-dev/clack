import * as p from './packages/prompts/dist/index.mjs';

p.columns({
	message: 'foo',
	items: [
		{ text: '10 repetitions'.repeat(10) },
		{ text: '20 repetitions'.repeat(20) },
		{ text: '1 repetition' }
	]
});
