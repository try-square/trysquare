'use strict';

const assert = require('node:assert/strict');
const { formatValue, selectorPrefix, applySelector, requireSelector } = require('./format');

function includes(item, selector) {
	requireSelector(selector, 'includes');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}includes ${formatValue(item)}`,
		assert(output) {
			const actual = applySelector(output, selector);
			if (typeof actual === 'string') {
				assert.ok(
					actual.includes(item),
					`expected string to include ${formatValue(item)}, got "${actual}"`
				);
			} else if (Array.isArray(actual)) {
				assert.ok(
					actual.includes(item),
					`expected array to include ${formatValue(item)}`
				);
			} else {
				throw new TypeError(
					`includes() expects string or array, received ${typeof actual}`
				);
			}
		},
	};
}

function hasProperty(key, selector) {
	if (typeof key !== 'string' || !key) {
		throw new TypeError('hasProperty() requires a non-empty string key as the first argument.');
	}
	requireSelector(selector, 'hasProperty');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}has property "${key}"`,
		assert(output) {
			const actual = applySelector(output, selector);
			assert.ok(
				actual != null && typeof actual === 'object',
				`expected an object, got ${typeof actual}`
			);
			assert.ok(
				key in actual,
				`expected object to have property "${key}"`
			);
		},
	};
}

module.exports = { includes, hasProperty };
