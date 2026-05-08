'use strict';

const assert = require('node:assert/strict');
const { formatValue, selectorPrefix, applySelector, requireSelector } = require('./format');

function matches(regex, selector) {
	if (!(regex instanceof RegExp)) {
		throw new TypeError('matches() requires a RegExp as the first argument.');
	}
	requireSelector(selector, 'matches');
	const prefix = selectorPrefix(selector);
	return {
		name: `${prefix}matches ${formatValue(regex)}`,
		assert(output) {
			const actual = applySelector(output, selector);
			assert.strictEqual(
				typeof actual,
				'string',
				`matches() expects a string, got ${typeof actual}`
			);
			assert.ok(
				regex.test(actual),
				`expected "${actual}" to match ${formatValue(regex)}`
			);
		},
	};
}

module.exports = { matches };
