'use strict';

function action(name, execute) {
	if (typeof name !== 'string' || !name) {
		throw new Error('action() requires a non-empty string name as the first argument.');
	}
	if (typeof execute !== 'function') {
		throw new Error(
			`action '${name}' requires an execute function as the second argument.`
		);
	}
	return { name, execute };
}

module.exports = { action };
