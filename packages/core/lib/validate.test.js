'use strict';

const assert = require('node:assert/strict');
const { when } = require('../index');

// Helper: call fn(), return the error thrown or null if it didn't throw.
function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

// ── when() acceptance ─────────────────────────────────────────────────────────

function callWhenWithNamedFn(_) {
	function myComponent(x) { return x; }
	return when(myComponent);
}

function isChainWithHasInputs(chain) {
	assert.ok(chain, 'chain should be returned');
	assert.ok(typeof chain.hasInputs === 'function');
}

when(callWhenWithNamedFn)
	.hasInputs({ name: 'named function', value: null })
	.expect.output(isChainWithHasInputs)
	.assert();

// ── when() with explicit label ────────────────────────────────────────────────

function callWhenWithExplicitLabel(_) {
	return when(() => {}, 'ExplicitLabel');
}

function isChain(result) {
	assert.ok(result, 'chain should be returned');
}

when(callWhenWithExplicitLabel)
	.hasInputs({ name: 'anonymous arrow with label', value: null })
	.expect.output(isChain)
	.assert();

// ── when() rejection ─────────────────────────────────────────────────────────

function callWhenWithAnonArrow(_) {
	return catching(() => when(() => {}));
}

function callWhenWithUnnamedObject(_) {
	return catching(() => when({ process() {} }));
}

function threwAboutNaming(err) {
	assert.ok(err instanceof Error, 'should have thrown');
	assert.ok(err.message.includes('named'), `message: ${err.message}`);
}

when(callWhenWithAnonArrow)
	.hasInputs({ name: 'anonymous arrow function', value: null })
	.expect.output(threwAboutNaming)
	.assert();

when(callWhenWithUnnamedObject)
	.hasInputs({ name: 'object without name', value: null })
	.expect.output(threwAboutNaming)
	.assert();

// ── when() with named object ──────────────────────────────────────────────────

function callWhenWithNamedObject(_) {
	const myModule = { name: 'MyModule', process() {} };
	return when(myModule);
}

when(callWhenWithNamedObject)
	.hasInputs({ name: 'named object', value: null })
	.expect.output(isChain)
	.assert();

// ── hasInputs() validation ────────────────────────────────────────────────────

function hasInputsWithoutName(_) {
	function myFn(x) { return x; }
	return catching(() => when(myFn).hasInputs({ value: 42 }));
}

function hasInputsWithName(_) {
	function myFn(x) { return x; }
	return when(myFn).hasInputs({ name: 'test input', value: 42 });
}

function threwAboutName(err) {
	assert.ok(err instanceof Error, 'should have thrown');
	assert.ok(err.message.includes('name'), `message: ${err.message}`);
}

function isChainWithStubsAndAndInputs(chain) {
	assert.ok(chain);
	assert.ok(typeof chain.stubs === 'function');
	assert.ok(typeof chain.andInputs === 'function');
}

when(hasInputsWithoutName)
	.hasInputs({ name: 'inputs missing name', value: null })
	.expect.output(threwAboutName)
	.assert();

when(hasInputsWithName)
	.hasInputs({ name: 'named inputs', value: null })
	.expect.output(isChainWithStubsAndAndInputs)
	.assert();

// ── stubs() validation ────────────────────────────────────────────────────────

function stubsWithoutName(_) {
	function myFn(x) { return x; }
	return catching(() => when(myFn).hasInputs({ name: 'x', value: 1 }).stubs({ inject: {} }));
}

when(stubsWithoutName)
	.hasInputs({ name: 'stub map missing name', value: null })
	.expect.output(threwAboutName)
	.assert();

// ── andUser() validation ──────────────────────────────────────────────────────

function andUserWithoutName(_) {
	function myComponent() {}
	return catching(() => when(myComponent).isInitialized().andUser({ click: 'button' }));
}

when(andUserWithoutName)
	.hasInputs({ name: 'user action missing name', value: null })
	.expect.output(threwAboutName)
	.assert();

// ── inState() validation ──────────────────────────────────────────────────────

function inStateWithoutName(_) {
	function myFn() {}
	return catching(() => when(myFn).inState({ phase: 'loading' }));
}

when(inStateWithoutName)
	.hasInputs({ name: 'lifecycle state missing name', value: null })
	.expect.output(threwAboutName)
	.assert();

// ── expect.output() spec validation ──────────────────────────────────────────

function outputWithAnonFn(_) {
	function myFn(x) { return x; }
	return catching(() => when(myFn).hasInputs({ name: 'x', value: 1 }).expect.output(result => result));
}

function outputWithNamedFn(_) {
	function myFn(x) { return x; }
	function resultIsOne(result) { assert.strictEqual(result.value, 1); }
	return when(myFn).hasInputs({ name: 'x', value: 1 }).expect.output(resultIsOne);
}

function outputWithSpecObject(_) {
	function myFn(x) { return x; }
	const spec = { name: 'result matches input', assert(result) { assert.strictEqual(result.value, 1); } };
	return when(myFn).hasInputs({ name: 'x', value: 1 }).expect.output(spec);
}

function outputWithUnnamedSpecObject(_) {
	function myFn(x) { return x; }
	return catching(() => when(myFn).hasInputs({ name: 'x', value: 1 }).expect.output({ assert() {} }));
}

function outputWithSpecObjectMissingAssert(_) {
	function myFn(x) { return x; }
	return catching(() => when(myFn).hasInputs({ name: 'x', value: 1 }).expect.output({ name: 'a spec', check() {} }));
}

function hasAssertMethod(termination) {
	assert.ok(typeof termination.assert === 'function');
}

function threwAboutAssert(err) {
	assert.ok(err instanceof Error, 'should have thrown');
	assert.ok(err.message.includes('assert'), `message: ${err.message}`);
}

when(outputWithAnonFn)
	.hasInputs({ name: 'anonymous spec function', value: null })
	.expect.output(threwAboutNaming)
	.assert();

when(outputWithNamedFn)
	.hasInputs({ name: 'named spec function', value: null })
	.expect.output(hasAssertMethod)
	.assert();

when(outputWithSpecObject)
	.hasInputs({ name: 'spec object with name and assert', value: null })
	.expect.output(hasAssertMethod)
	.assert();

when(outputWithUnnamedSpecObject)
	.hasInputs({ name: 'spec object without name', value: null })
	.expect.output(threwAboutName)
	.assert();

when(outputWithSpecObjectMissingAssert)
	.hasInputs({ name: 'spec object without assert', value: null })
	.expect.output(threwAboutAssert)
	.assert();
