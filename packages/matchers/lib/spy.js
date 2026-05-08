'use strict';

const assert = require('node:assert/strict');
const { formatValue } = require('./format');

// Monotonic sequence counter shared across all spies — used for call-order assertions.
let _globalSeq = 0;

function requireSpy(fn, matcherName) {
	if (!fn || typeof fn !== 'function' || !fn._isSpy) {
		throw new TypeError(
			`${matcherName}() requires a spy created with spy(). ` +
			'Pass a named spy function as the first argument.'
		);
	}
}

// ── Spy creator ───────────────────────────────────────────────────────────────

function spy(name, implementation) {
	if (typeof name !== 'string' || !name) {
		throw new TypeError('spy() requires a non-empty string name.');
	}
	if (implementation !== undefined && typeof implementation !== 'function') {
		throw new TypeError('spy() implementation must be a function.');
	}

	const calls    = [];
	const callSeqs = [];

	function spyFn(...args) {
		calls.push(args);
		callSeqs.push(_globalSeq++);
		return implementation ? implementation(...args) : undefined;
	}

	Object.defineProperty(spyFn, 'name', { value: name, configurable: true });
	spyFn._calls    = calls;
	spyFn._callSeqs = callSeqs;
	spyFn._isSpy    = true;
	spyFn.reset     = function reset() { calls.length = 0; callSeqs.length = 0; };

	return spyFn;
}

// ── Unified: functionCall(spy, { times?, arguments? }) ────────────────────────

function buildFunctionCallName(spyName, opts) {
	let callPart;
	if (opts.times === 0)             callPart = 'was not called';
	else if (opts.times === 1)        callPart = 'was called once';
	else if (typeof opts.times === 'number') callPart = `was called ${opts.times} times`;
	else                              callPart = 'was called';

	const argPart = (opts.arguments !== undefined && opts.times !== 0)
		? ` with ${formatValue(opts.arguments)}`
		: '';

	return `${spyName} ${callPart}${argPart}`;
}

function functionCall(spyFn, options) {
	requireSpy(spyFn, 'functionCall');
	const opts = options || {};

	return {
		name: buildFunctionCallName(spyFn.name, opts),
		assert(_output) {
			const calls = spyFn._calls;

			if (opts.times !== undefined) {
				assert.strictEqual(
					calls.length,
					opts.times,
					`expected ${spyFn.name} to be called ${opts.times} time(s), got ${calls.length}`
				);
			} else if (opts.arguments === undefined) {
				assert.ok(calls.length > 0, `expected ${spyFn.name} to have been called`);
			}

			if (opts.arguments !== undefined && opts.times !== 0) {
				const match = calls.some(callArgs => {
					try { assert.deepStrictEqual(callArgs, opts.arguments); return true; }
					catch (_) { return false; }
				});
				assert.ok(
					match,
					`expected ${spyFn.name} to have been called with ${formatValue(opts.arguments)}, ` +
					`but calls were: ${calls.map(c => formatValue(c)).join(', ') || '(none)'}`
				);
			}
		},
	};
}

// ── Individual matchers ───────────────────────────────────────────────────────

function wasCalled(spyFn) {
	requireSpy(spyFn, 'wasCalled');
	return {
		name: `${spyFn.name} was called`,
		assert(_output) {
			assert.ok(
				spyFn._calls.length > 0,
				`expected ${spyFn.name} to have been called`
			);
		},
	};
}

function wasCalledOnce(spyFn) {
	requireSpy(spyFn, 'wasCalledOnce');
	return {
		name: `${spyFn.name} was called once`,
		assert(_output) {
			assert.strictEqual(
				spyFn._calls.length, 1,
				`expected ${spyFn.name} to be called once, got ${spyFn._calls.length}`
			);
		},
	};
}

function wasCalledTimes(spyFn, n) {
	requireSpy(spyFn, 'wasCalledTimes');
	if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
		throw new TypeError('wasCalledTimes() requires a non-negative integer as the second argument.');
	}
	const timesWord = n === 1 ? '1 time' : `${n} times`;
	return {
		name: `${spyFn.name} was called ${timesWord}`,
		assert(_output) {
			assert.strictEqual(
				spyFn._calls.length, n,
				`expected ${spyFn.name} to be called ${timesWord}, got ${spyFn._calls.length}`
			);
		},
	};
}

function wasCalledWith(spyFn, expectedArgs) {
	requireSpy(spyFn, 'wasCalledWith');
	return {
		name: `${spyFn.name} was called with ${formatValue(expectedArgs)}`,
		assert(_output) {
			const match = spyFn._calls.some(callArgs => {
				try { assert.deepStrictEqual(callArgs, expectedArgs); return true; }
				catch (_) { return false; }
			});
			assert.ok(
				match,
				`expected ${spyFn.name} to be called with ${formatValue(expectedArgs)}, ` +
				`but calls were: ${spyFn._calls.map(c => formatValue(c)).join(', ') || '(none)'}`
			);
		},
	};
}

function wasNotCalled(spyFn) {
	requireSpy(spyFn, 'wasNotCalled');
	return {
		name: `${spyFn.name} was not called`,
		assert(_output) {
			assert.strictEqual(
				spyFn._calls.length, 0,
				`expected ${spyFn.name} not to be called, but was called ${spyFn._calls.length} times`
			);
		},
	};
}

// ── returns() — per-call sequence of return values for spy() ─────────────────

function returns(...values) {
	if (values.length === 0) {
		throw new TypeError('returns() requires at least one value.');
	}
	let index = 0;
	return function returnsSequence() {
		const value = values[index];
		if (index < values.length - 1) index++;
		return value;
	};
}

// ── Call-ordering matchers ────────────────────────────────────────────────────

function wasCalledBefore(spyA, spyB) {
	requireSpy(spyA, 'wasCalledBefore');
	requireSpy(spyB, 'wasCalledBefore');
	return {
		name: `${spyA.name} was called before ${spyB.name}`,
		assert(_output) {
			assert.ok(
				spyA._callSeqs.length > 0,
				`expected ${spyA.name} to have been called`
			);
			assert.ok(
				spyB._callSeqs.length > 0,
				`expected ${spyB.name} to have been called`
			);
			const firstA = spyA._callSeqs[0];
			const firstB = spyB._callSeqs[0];
			assert.ok(
				firstA < firstB,
				`expected ${spyA.name} (seq ${firstA}) to be called before ${spyB.name} (seq ${firstB})`
			);
		},
	};
}

function wasCalledAfter(spyA, spyB) {
	requireSpy(spyA, 'wasCalledAfter');
	requireSpy(spyB, 'wasCalledAfter');
	return {
		name: `${spyA.name} was called after ${spyB.name}`,
		assert(_output) {
			assert.ok(
				spyA._callSeqs.length > 0,
				`expected ${spyA.name} to have been called`
			);
			assert.ok(
				spyB._callSeqs.length > 0,
				`expected ${spyB.name} to have been called`
			);
			const firstA = spyA._callSeqs[0];
			const firstB = spyB._callSeqs[0];
			assert.ok(
				firstA > firstB,
				`expected ${spyA.name} (seq ${firstA}) to be called after ${spyB.name} (seq ${firstB})`
			);
		},
	};
}

function wasCalledFirst(spyFn, ...others) {
	requireSpy(spyFn, 'wasCalledFirst');
	others.forEach(s => requireSpy(s, 'wasCalledFirst'));
	return {
		name: `${spyFn.name} was called first`,
		assert(_output) {
			assert.ok(spyFn._callSeqs.length > 0, `expected ${spyFn.name} to have been called`);
			const seq = spyFn._callSeqs[0];
			for (const other of others) {
				assert.ok(other._callSeqs.length > 0, `expected ${other.name} to have been called`);
				assert.ok(
					seq < other._callSeqs[0],
					`expected ${spyFn.name} (seq ${seq}) to be called before ${other.name} (seq ${other._callSeqs[0]})`
				);
			}
		},
	};
}

function wasCalledLast(spyFn, ...others) {
	requireSpy(spyFn, 'wasCalledLast');
	others.forEach(s => requireSpy(s, 'wasCalledLast'));
	return {
		name: `${spyFn.name} was called last`,
		assert(_output) {
			assert.ok(spyFn._callSeqs.length > 0, `expected ${spyFn.name} to have been called`);
			const seq = spyFn._callSeqs[0];
			for (const other of others) {
				assert.ok(other._callSeqs.length > 0, `expected ${other.name} to have been called`);
				assert.ok(
					seq > other._callSeqs[0],
					`expected ${spyFn.name} (seq ${seq}) to be called after ${other.name} (seq ${other._callSeqs[0]})`
				);
			}
		},
	};
}

module.exports = {
	spy,
	returns,
	functionCall,
	wasCalled,
	wasCalledOnce,
	wasCalledTimes,
	wasCalledWith,
	wasNotCalled,
	wasCalledBefore,
	wasCalledAfter,
	wasCalledFirst,
	wasCalledLast,
};
