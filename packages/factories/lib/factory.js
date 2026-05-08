'use strict';

function factory(defaults) {
	const base = (defaults && typeof defaults === 'object') ? defaults : {};
	return function create(name, overrides) {
		if (typeof name !== 'string' || !name) {
			throw new Error('factory create() requires a non-empty string name as the first argument.');
		}
		return { ...base, ...(overrides || {}), name };
	};
}

module.exports = { factory };
