'use strict';

function sequence(start, step) {
	const from = (typeof start === 'number') ? start : 1;
	const by   = (typeof step  === 'number' && step > 0) ? step : 1;
	let current = from;
	return function next() {
		const value = current;
		current += by;
		return value;
	};
}

module.exports = { sequence };
