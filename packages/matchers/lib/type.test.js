'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('@trysquare/core');
const { isType, isNull, isDefined } = require('./type');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

// ── isType() ──────────────────────────────────────────────────────────────────

function isTypeAll(_) {
	function value(r) { return r.value; }
	function score(r) { return r.score; }
	return {
		strName:    isType('string').name,
		numName:    isType('number').name,
		boolName:   isType('boolean').name,
		objName:    isType('object').name,
		passStr:    catching(() => isType('string').assert('hello')),
		passNum:    catching(() => isType('number').assert(42)),
		passBool:   catching(() => isType('boolean').assert(true)),
		passObj:    catching(() => isType('object').assert({})),
		passNull:   catching(() => isType('object').assert(null)),  // typeof null === 'object'
		failStrNum: catching(() => isType('string').assert(42)),
		failNumStr: catching(() => isType('number').assert('42')),
		emptyType:  catching(() => isType('')),
		nullType:   catching(() => isType(null)),
		namedSel:   isType('number', value).name,
		passSelector: catching(() => isType('number', score).assert({ score: 100 })),
		failSelector: catching(() => isType('number', score).assert({ score: 'high' })),
		badSelector:  catching(() => isType('string', 'bad')),
	};
}

function isTypeCorrect(r) {
	assert.strictEqual(r.strName,  'is string');
	assert.strictEqual(r.numName,  'is number');
	assert.strictEqual(r.boolName, 'is boolean');
	assert.strictEqual(r.objName,  'is object');
	assert.strictEqual(r.passStr,  null);
	assert.strictEqual(r.passNum,  null);
	assert.strictEqual(r.passBool, null);
	assert.strictEqual(r.passObj,  null);
	assert.strictEqual(r.passNull, null);
	assert.ok(r.failStrNum instanceof Error);
	assert.ok(r.failNumStr instanceof Error);
	assert.match(r.emptyType.message, /non-empty string/);
	assert.match(r.nullType.message,  /non-empty string/);
	assert.strictEqual(r.namedSel,     'value is number');
	assert.strictEqual(r.passSelector, null);
	assert.ok(r.failSelector instanceof Error);
	assert.match(r.badSelector.message, /selector must be a function/);
}

when(isTypeAll)
	.hasInputs({ name: 'isType behavior', value: null })
	.expect.output(isTypeCorrect)
	.assert();

// ── isNull() ──────────────────────────────────────────────────────────────────

function isNullAll(_) {
	function error(r) { return r.error; }
	return {
		name:          isNull().name,
		passNull:      catching(() => isNull().assert(null)),
		failUndefined: catching(() => isNull().assert(undefined)),
		failZero:      catching(() => isNull().assert(0)),
		failEmpty:     catching(() => isNull().assert('')),
		failFalse:     catching(() => isNull().assert(false)),
		namedSel:      isNull(error).name,
		passSelector:  catching(() => isNull(error).assert({ error: null })),
		failSelector:  catching(() => isNull(error).assert({ error: new Error('oops') })),
	};
}

function isNullCorrect(r) {
	assert.strictEqual(r.name,      'is null');
	assert.strictEqual(r.passNull,  null);
	assert.ok(r.failUndefined instanceof Error);
	assert.ok(r.failZero      instanceof Error);
	assert.ok(r.failEmpty     instanceof Error);
	assert.ok(r.failFalse     instanceof Error);
	assert.strictEqual(r.namedSel, 'error is null');
	assert.strictEqual(r.passSelector, null);
	assert.ok(r.failSelector instanceof Error);
}

when(isNullAll)
	.hasInputs({ name: 'isNull behavior', value: null })
	.expect.output(isNullCorrect)
	.assert();

// ── isDefined() ───────────────────────────────────────────────────────────────

function isDefinedAll(_) {
	function result(r) { return r.result; }
	function id(r) { return r.id; }
	return {
		name:          isDefined().name,
		passString:    catching(() => isDefined().assert('hello')),
		passZero:      catching(() => isDefined().assert(0)),
		passNull:      catching(() => isDefined().assert(null)),
		passFalse:     catching(() => isDefined().assert(false)),
		passObject:    catching(() => isDefined().assert({})),
		failUndefined: catching(() => isDefined().assert(undefined)),
		namedSel:      isDefined(result).name,
		passSelector:  catching(() => isDefined(id).assert({ id: 'abc' })),
		failSelector:  catching(() => isDefined(id).assert({ id: undefined })),
	};
}

function isDefinedCorrect(r) {
	assert.strictEqual(r.name,      'is defined');
	assert.strictEqual(r.passString, null);
	assert.strictEqual(r.passZero,   null);
	assert.strictEqual(r.passNull,   null);
	assert.strictEqual(r.passFalse,  null);
	assert.strictEqual(r.passObject, null);
	assert.ok(r.failUndefined instanceof Error);
	assert.strictEqual(r.namedSel, 'result is defined');
	assert.strictEqual(r.passSelector, null);
	assert.ok(r.failSelector instanceof Error);
}

when(isDefinedAll)
	.hasInputs({ name: 'isDefined behavior', value: null })
	.expect.output(isDefinedCorrect)
	.assert();

// ── Integration ───────────────────────────────────────────────────────────────

async function isTypeIntegration(_) {
	const { runner: r, when: w } = createRunner();
	function greet(input) { return `Hello, ${input.name}`; }
	w(greet).hasInputs({ name: 'Alice' }).expect.output(isType('string')).assert();
	return r.run();
}

function hasOnePassing(suite) {
	assert.strictEqual(suite.passed, 1);
}

when(isTypeIntegration)
	.hasInputs({ name: 'isType integration', value: null })
	.expect.output(hasOnePassing)
	.assert();

async function isNullIntegration(_) {
	const { runner: r, when: w } = createRunner();
	function findUser(input) { return input.exists ? { id: 1 } : null; }
	w(findUser).hasInputs({ name: 'missing user', exists: false }).expect.output(isNull()).assert();
	return r.run();
}

when(isNullIntegration)
	.hasInputs({ name: 'isNull integration', value: null })
	.expect.output(hasOnePassing)
	.assert();

async function isDefinedIntegrationFail(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return input.value; }
	w(identity).hasInputs({ name: 'undefined value', value: undefined }).expect.output(isDefined()).assert();
	const suite = await r.run();
	return { suite, specResult: r._tests[0].specResults[0] };
}

function failedWithDefinedSpecName(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.specResult.name,   'is defined');
	assert.strictEqual(result.specResult.result, 'fail');
}

when(isDefinedIntegrationFail)
	.hasInputs({ name: 'isDefined integration fail', value: null })
	.expect.output(failedWithDefinedSpecName)
	.assert();
