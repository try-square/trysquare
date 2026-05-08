'use strict';

// Applies mocks to global scope. Keys in the 'global.X' format set global[X].
// Returns a restore function that reverts all applied mocks.
//
// Only 'global.*' keys are supported. Other key formats are ignored with a warning
// so that users can add framework-specific keys (e.g. module mocks in Jest) without breaking.
function applyMocks(mocks) {
	const applied = [];

	for (const [key, value] of Object.entries(mocks || {})) {
		if (key.startsWith('global.')) {
			const prop = key.slice('global.'.length);
			applied.push({ prop, original: global[prop], hadOwn: Object.prototype.hasOwnProperty.call(global, prop) });
			global[prop] = value;
		}
	}

	return function restoreMocks() {
		for (const { prop, original, hadOwn } of applied) {
			if (!hadOwn) {
				delete global[prop];
			} else {
				global[prop] = original;
			}
		}
	};
}

module.exports = { applyMocks };
