'use strict';

const assert = require('node:assert/strict');
const { selectorPrefix, applySelector, requireSelector } = require('./format');

function isType(typeName, selector) {
	if (typeof typeName !== 'string' || !typeName) {
		throw new TypeError('isType() requires a non-empty string type name as the first argument.');
	}
	requireSelector(selector, 'isType');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}is ${typeName}`,
		assert(output) {
			const actual = applySelector(output, selector);
			assert.strictEqual(
				typeof actual,
				typeName,
				`expected typeof to be "${typeName}", got "${typeof actual}"`
			);
		},
	};
}

function isNull(selector) {
	requireSelector(selector, 'isNull');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}is null`,
		assert(output) {
			const actual = applySelector(output, selector);
			assert.strictEqual(actual, null, `expected null, got ${String(actual)}`);
		},
	};
}

function isDefined(selector) {
	requireSelector(selector, 'isDefined');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}is defined`,
		assert(output) {
			const actual = applySelector(output, selector);
			assert.notStrictEqual(actual, undefined, 'expected value to be defined');
		},
	};
}

module.exports = { isType, isNull, isDefined };
