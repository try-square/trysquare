'use strict';

const assert = require('node:assert/strict');
const { formatValue, selectorPrefix, applySelector, requireSelector } = require('./format');

function equals(expected, selector) {
	requireSelector(selector, 'equals');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}equals ${formatValue(expected)}`,
		assert(output) {
			assert.strictEqual(applySelector(output, selector), expected);
		},
	};
}

function deepEquals(expected, selector) {
	requireSelector(selector, 'deepEquals');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}deeply equals ${formatValue(expected)}`,
		assert(output) {
			assert.deepStrictEqual(applySelector(output, selector), expected);
		},
	};
}

module.exports = { equals, deepEquals };
