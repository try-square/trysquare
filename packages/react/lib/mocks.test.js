'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { applyMocks } = require('./mocks');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function applyMocksBehavior(_) {
	// sets global and restores to undefined
	const mockFn = () => {};
	const restore1 = applyMocks({ 'global.__trysquare_test_prop__': mockFn });
	const setCorrectly = global.__trysquare_test_prop__ === mockFn;
	restore1();
	const removedAfterRestore = global.__trysquare_test_prop__ === undefined;

	// restores to original value when property existed
	const originalFetch = global.fetch;
	const mockFetch = () => {};
	const restore2 = applyMocks({ 'global.fetch': mockFetch });
	restore2();
	const restoredFetch = global.fetch === originalFetch;

	// multiple mocks
	const mockA = () => 'a';
	const mockB = () => 'b';
	const restore3 = applyMocks({ 'global.__mockA__': mockA, 'global.__mockB__': mockB });
	const bothSet = global.__mockA__ === mockA && global.__mockB__ === mockB;
	restore3();
	const bothRemoved = global.__mockA__ === undefined && global.__mockB__ === undefined;

	return {
		setCorrectly,
		removedAfterRestore,
		restoredFetch,
		bothSet,
		bothRemoved,
		nonGlobalThrow: catching(() => { const r = applyMocks({ 'someModule': () => {} }); r(); }),
		emptyThrow:     catching(() => { const r = applyMocks({}); r(); }),
		nullThrow:      catching(() => { const r = applyMocks(null); r(); const r2 = applyMocks(undefined); r2(); }),
	};
}

function applyMocksBehaviorCorrect(r) {
	assert.strictEqual(r.setCorrectly, true);
	assert.strictEqual(r.removedAfterRestore, true);
	assert.strictEqual(r.restoredFetch, true);
	assert.strictEqual(r.bothSet, true);
	assert.strictEqual(r.bothRemoved, true);
	assert.strictEqual(r.nonGlobalThrow, null);
	assert.strictEqual(r.emptyThrow, null);
	assert.strictEqual(r.nullThrow, null);
}

when(applyMocksBehavior)
	.hasInputs({ name: 'applyMocks() behavior', value: null })
	.expect.output(applyMocksBehaviorCorrect)
	.assert();
