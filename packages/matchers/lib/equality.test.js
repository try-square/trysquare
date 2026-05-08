'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('@trysquare/core');
const { equals, deepEquals } = require('./equality');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

// ── equals() names ────────────────────────────────────────────────────────────

function equalsNames(_) {
	return {
		number:  equals(42).name,
		string:  equals('hi').name,
		null_:   equals(null).name,
		bool:    equals(true).name,
	};
}

function namesEncodeExpectedValues(r) {
	assert.strictEqual(r.number, 'equals 42');
	assert.strictEqual(r.string, 'equals "hi"');
	assert.strictEqual(r.null_,  'equals null');
	assert.strictEqual(r.bool,   'equals true');
}

when(equalsNames)
	.hasInputs({ name: 'primitive types', value: null })
	.expect.output(namesEncodeExpectedValues)
	.assert();

// ── equals() assert behavior ──────────────────────────────────────────────────

function equalsAssertBehavior(_) {
	return {
		matchNumber:  catching(() => equals(42).assert(42)),
		matchString:  catching(() => equals('hi').assert('hi')),
		matchNull:    catching(() => equals(null).assert(null)),
		failNumber:   catching(() => equals(42).assert(99)),
		failString:   catching(() => equals('hi').assert('bye')),
		failWrongType:catching(() => equals(42).assert('42')),
	};
}

function passesAndFailsCorrectly(r) {
	assert.strictEqual(r.matchNumber,   null, 'should pass for matching number');
	assert.strictEqual(r.matchString,   null, 'should pass for matching string');
	assert.strictEqual(r.matchNull,     null, 'should pass for matching null');
	assert.ok(r.failNumber   instanceof Error, 'should throw for different number');
	assert.ok(r.failString   instanceof Error, 'should throw for different string');
	assert.ok(r.failWrongType instanceof Error, 'should throw for wrong type');
}

when(equalsAssertBehavior)
	.hasInputs({ name: 'equals assert behavior', value: null })
	.expect.output(passesAndFailsCorrectly)
	.assert();

// ── equals() selector ─────────────────────────────────────────────────────────

function equalsWithSelector(_) {
	function count(r) { return r.length; }
	function total(r) { return r.total; }
	return {
		namedSelectorName:    equals(3, count).name,
		anonSelectorName:     equals(3, r => r.length).name,
		passWithSelector:     catching(() => equals(100, total).assert({ total: 100 })),
		failWithSelector:     catching(() => equals(100, total).assert({ total: 99 })),
		badSelectorThrows:    catching(() => equals(1, 'bad')),
	};
}

function selectorBehavior(r) {
	assert.strictEqual(r.namedSelectorName, 'count equals 3');
	assert.strictEqual(r.anonSelectorName,  'equals 3');
	assert.strictEqual(r.passWithSelector,  null, 'should pass when selector+equals matches');
	assert.ok(r.failWithSelector instanceof Error, 'should throw when selector+equals fails');
	assert.match(r.badSelectorThrows.message, /selector must be a function/);
}

when(equalsWithSelector)
	.hasInputs({ name: 'equals with selector', value: null })
	.expect.output(selectorBehavior)
	.assert();

// ── deepEquals() ─────────────────────────────────────────────────────────────

function deepEqualsAll(_) {
	function user(r) { return r.user; }
	return {
		objectName:   deepEquals({ a: 1 }).name,
		arrayName:    deepEquals([1, 2]).name,
		passObject:   catching(() => deepEquals({ a: 1 }).assert({ a: 1 })),
		passArray:    catching(() => deepEquals([1, 2, 3]).assert([1, 2, 3])),
		failObject:   catching(() => deepEquals({ a: 1 }).assert({ a: 2 })),
		failArray:    catching(() => deepEquals([1, 2]).assert([1, 3])),
		namedSelector:deepEquals({ id: 1 }, user).name,
		passSelector: catching(() => deepEquals([1, 2], r => r.items).assert({ items: [1, 2] })),
		failSelector: catching(() => deepEquals([1, 2], r => r.items).assert({ items: [1, 3] })),
	};
}

function deepEqualsCorrect(r) {
	assert.strictEqual(r.objectName,    'deeply equals {"a":1}');
	assert.strictEqual(r.arrayName,     'deeply equals [1,2]');
	assert.strictEqual(r.passObject,    null);
	assert.strictEqual(r.passArray,     null);
	assert.ok(r.failObject instanceof Error);
	assert.ok(r.failArray  instanceof Error);
	assert.strictEqual(r.namedSelector, 'user deeply equals {"id":1}');
	assert.strictEqual(r.passSelector,  null);
	assert.ok(r.failSelector instanceof Error);
}

when(deepEqualsAll)
	.hasInputs({ name: 'deepEquals behavior', value: null })
	.expect.output(deepEqualsCorrect)
	.assert();

// ── Integration ───────────────────────────────────────────────────────────────

async function equalsMakesTestPass(_) {
	const { runner: r, when: w } = createRunner();
	function double(input) { return input.value * 2; }
	w(double).hasInputs({ name: 'five', value: 5 }).expect.output(equals(10)).assert();
	return r.run();
}

function hasOnePassing(suite) {
	assert.strictEqual(suite.passed, 1);
	assert.strictEqual(suite.failed, 0);
}

when(equalsMakesTestPass)
	.hasInputs({ name: 'equals integration pass', value: null })
	.expect.output(hasOnePassing)
	.assert();

async function equalsMakesTestFail(_) {
	const { runner: r, when: w } = createRunner();
	function double(input) { return input.value * 2; }
	w(double).hasInputs({ name: 'five', value: 5 }).expect.output(equals(99)).assert();
	const suite = await r.run();
	return { suite, specResult: r._tests[0].specResults[0] };
}

function failedWithCorrectSpecName(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.specResult.name,   'equals 99');
	assert.strictEqual(result.specResult.result, 'fail');
}

when(equalsMakesTestFail)
	.hasInputs({ name: 'equals integration fail', value: null })
	.expect.output(failedWithCorrectSpecName)
	.assert();

async function deepEqualsMakesTestPass(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return { value: input.value }; }
	w(identity).hasInputs({ name: 'input', value: 7 }).expect.output(deepEquals({ value: 7 })).assert();
	return r.run();
}

when(deepEqualsMakesTestPass)
	.hasInputs({ name: 'deepEquals integration pass', value: null })
	.expect.output(hasOnePassing)
	.assert();

async function equalsSelectorSpecName(_) {
	const { runner: r, when: w } = createRunner();
	function greet(input) { return { message: `Hello, ${input.name}!` }; }
	function message(res) { return res.message; }
	w(greet).hasInputs({ name: 'Alice' }).expect.output(equals('Hello, Alice!', message)).assert();
	const suite = await r.run();
	return { suite, specName: r._tests[0].specResults[0].name };
}

function specNameReflectsSelector(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specName, 'message equals "Hello, Alice!"');
}

when(equalsSelectorSpecName)
	.hasInputs({ name: 'equals selector spec name', value: null })
	.expect.output(specNameReflectsSelector)
	.assert();
