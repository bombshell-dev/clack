const child_process = require('node:child_process');

module.exports = {
	...child_process,
	spawnSync() {
		return undefined;
	},
};
