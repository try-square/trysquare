'use strict';

function formatValue(v) {
	if (v instanceof RegExp)  return v.toString();
	if (typeof v === 'string') return `"${v}"`;
	try {
		const json = JSON.stringify(v);
		return json.length > 60 ? json.slice(0, 57) + '...' : json;
	} catch (_) {
		return String(v);
	}
}

// Returns "selectorName " (with trailing space) if selector is a named function, else "".
function selectorPrefix(selector) {
	return (selector && typeof selector === 'function' && selector.name)
		? selector.name + ' '
		: '';
}

function applySelector(output, selector) {
	return selector ? selector(output) : output;
}

function requireSelector(selector, matcherName) {
	if (selector !== undefined && typeof selector !== 'function') {
		throw new TypeError(
			`${matcherName}() selector must be a function, got ${typeof selector}.`
		);
	}
}

module.exports = { formatValue, selectorPrefix, applySelector, requireSelector };
