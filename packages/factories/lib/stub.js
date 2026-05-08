'use strict';

function stub(name, inject) {
	if (typeof name !== 'string' || !name) {
		throw new Error('stub() requires a non-empty string name as the first argument.');
	}
	return { name, inject: inject || {} };
}

module.exports = { stub };
