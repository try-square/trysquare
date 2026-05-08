'use strict';

function input(name, fields) {
	if (typeof name !== 'string' || !name) {
		throw new Error('input() requires a non-empty string name as the first argument.');
	}
	return { ...(fields || {}), name };
}

module.exports = { input };
