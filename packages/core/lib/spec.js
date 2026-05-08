'use strict';

function normalizeSpec(spec, index) {
	if (typeof spec === 'function') {
		if (!spec.name) {
			throw new Error(
				`Spec at position ${index} requires a name. ` +
				'Use a named function or { name, assert } object. ' +
				'Anonymous functions produce unreadable documentation.'
			);
		}
		return { name: spec.name, assert: spec };
	}

	if (spec && typeof spec === 'object') {
		if (!spec.name || typeof spec.name !== 'string') {
			throw new Error(
				`Spec object at position ${index} requires a name property. ` +
				'Anonymous specs produce unreadable documentation.'
			);
		}
		if (typeof spec.assert !== 'function') {
			throw new Error(`Spec object '${spec.name}' requires an assert function property.`);
		}
		return { name: spec.name, assert: spec.assert };
	}

	throw new Error(
		`Invalid spec at position ${index}. ` +
		'Expected a named function or { name, assert } object.'
	);
}

function normalizeSpecs(specs) {
	return specs.map((spec, index) => normalizeSpec(spec, index));
}

module.exports = { normalizeSpec, normalizeSpecs };
