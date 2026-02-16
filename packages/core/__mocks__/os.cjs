const os = require('node:os');

module.exports = {
	...os,
	tmpdir() {
		return '/tmp';
	},
};
