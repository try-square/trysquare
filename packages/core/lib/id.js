'use strict';

let counter = 0;

function nextId() {
	return `sq_${++counter}`;
}

function resetIdCounter() {
	counter = 0;
}

module.exports = { nextId, resetIdCounter };
