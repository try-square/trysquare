'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('@trysquare/core');
const { includes, hasProperty } = require('./structure');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

// ── includes() names ──────────────────────────────────────────────────────────

function includesNames(_) {
	return {
		string: includes('Alice').name,
		number: includes(42).name,
	};
}

function namesEncodeItem(r) {
	assert.strictEqual(r.string, 'includes "Alice"');
	assert.strictEqual(r.number, 'includes 42');
}

when(includesNames)
	.hasInputs({ name: 'name encoding', value: null })
	.expect.output(namesEncodeItem)
	.assert();

// ── includes() assert behavior ────────────────────────────────────────────────

function includesAssertBehavior(_) {
	return {
		strContains:    catching(() => includes('ello').assert('Hello, world')),
		strEmpty:       catching(() => includes('').assert('anything')),
		strMissing:     catching(() => includes('Alice').assert('Hello, Bob')),
		arrContains:    catching(() => includes(2).assert([1, 2, 3])),
		arrMissing:     catching(() => includes(99).assert([1, 2, 3])),
		nonStringArr:   catching(() => includes('x').assert(42)),
		nullInput:      catching(() => includes('x').assert(null)),
	};
}

function includesPassesAndFails(r) {
	assert.strictEqual(r.strContains, null);
	assert.strictEqual(r.strEmpty,    null);
	assert.ok(r.strMissing   instanceof Error);
	assert.strictEqual(r.arrContains, null);
	assert.ok(r.arrMissing   instanceof Error);
	assert.match(r.nonStringArr.message, /expects string or array/);
	assert.match(r.nullInput.message,    /expects string or array/);
}

when(includesAssertBehavior)
	.hasInputs({ name: 'includes assert behavior', value: null })
	.expect.output(includesPassesAndFails)
	.assert();

// ── includes() selector ───────────────────────────────────────────────────────

function includesWithSelector(_) {
	function names(r) { return r.names; }
	function tags(r)  { return r.tags; }
	return {
		namedSelectorName: includes('Alice', names).name,
		passWithSelector:  catching(() => includes('urgent', tags).assert({ tags: ['urgent', 'billing'] })),
		failWithSelector:  catching(() => includes('urgent', tags).assert({ tags: ['billing'] })),
		badSelector:       catching(() => includes('x', 'bad')),
	};
}

function includesSelectorBehavior(r) {
	assert.strictEqual(r.namedSelectorName, 'names includes "Alice"');
	assert.strictEqual(r.passWithSelector,  null);
	assert.ok(r.failWithSelector instanceof Error);
	assert.match(r.badSelector.message, /selector must be a function/);
}

when(includesWithSelector)
	.hasInputs({ name: 'includes with selector', value: null })
	.expect.output(includesSelectorBehavior)
	.assert();

// ── hasProperty() ─────────────────────────────────────────────────────────────

function hasPropertyAll(_) {
	function user(r) { return r.user; }
	return {
		roleName:        hasProperty('role').name,
		idName:          hasProperty('id').name,
		passPresent:     catching(() => hasProperty('role').assert({ role: 'admin' })),
		passFalsy:       catching(() => hasProperty('enabled').assert({ enabled: false })),
		passZero:        catching(() => hasProperty('score').assert({ score: 0 })),
		passEmpty:       catching(() => hasProperty('label').assert({ label: '' })),
		failAbsent:      catching(() => hasProperty('role').assert({ name: 'Alice' })),
		failString:      catching(() => hasProperty('x').assert('string')),
		failNull:        catching(() => hasProperty('x').assert(null)),
		failNumber:      catching(() => hasProperty('x').assert(42)),
		emptyKey:        catching(() => hasProperty('')),
		nullKey:         catching(() => hasProperty(null)),
		namedSelector:   hasProperty('role', user).name,
		passSelector:    catching(() => hasProperty('role', user).assert({ user: { role: 'admin' } })),
		failSelector:    catching(() => hasProperty('role', user).assert({ user: { name: 'Alice' } })),
		badSelector:     catching(() => hasProperty('x', 'bad')),
	};
}

function hasPropertyBehavior(r) {
	assert.strictEqual(r.roleName, 'has property "role"');
	assert.strictEqual(r.idName,   'has property "id"');
	assert.strictEqual(r.passPresent, null);
	assert.strictEqual(r.passFalsy,   null);
	assert.strictEqual(r.passZero,    null);
	assert.strictEqual(r.passEmpty,   null);
	assert.ok(r.failAbsent  instanceof Error);
	assert.match(r.failString.message, /expected an object/);
	assert.match(r.failNull.message,   /expected an object/);
	assert.match(r.failNumber.message, /expected an object/);
	assert.match(r.emptyKey.message,   /non-empty string key/);
	assert.match(r.nullKey.message,    /non-empty string key/);
	assert.strictEqual(r.namedSelector, 'user has property "role"');
	assert.strictEqual(r.passSelector,  null);
	assert.ok(r.failSelector instanceof Error);
	assert.match(r.badSelector.message, /selector must be a function/);
}

when(hasPropertyAll)
	.hasInputs({ name: 'hasProperty behavior', value: null })
	.expect.output(hasPropertyBehavior)
	.assert();

// ── Integration ───────────────────────────────────────────────────────────────

async function includesIntegration(_) {
	const { runner: r, when: w } = createRunner();
	function getTags(input) { return { tags: input.tags }; }
	function tags(res) { return res.tags; }
	w(getTags).hasInputs({ name: 'with urgent', tags: ['urgent', 'billing'] }).expect.output(includes('urgent', tags)).assert();
	const suite = await r.run();
	return { suite, specName: r._tests[0].specResults[0].name };
}

function passedWithTagsSpecName(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specName, 'tags includes "urgent"');
}

when(includesIntegration)
	.hasInputs({ name: 'includes integration', value: null })
	.expect.output(passedWithTagsSpecName)
	.assert();

async function hasPropertyIntegration(_) {
	const { runner: r, when: w } = createRunner();
	function buildUser(input) { return { name: input.name, role: 'member' }; }
	w(buildUser).hasInputs({ name: 'Alice' }).expect.output(hasProperty('name'), hasProperty('role')).assert();
	const suite = await r.run();
	return { suite, specCount: r._tests[0].specResults.length };
}

function passedWithTwoSpecs(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specCount, 2);
}

when(hasPropertyIntegration)
	.hasInputs({ name: 'hasProperty integration pass', value: null })
	.expect.output(passedWithTwoSpecs)
	.assert();

async function hasPropertyIntegrationFail(_) {
	const { runner: r, when: w } = createRunner();
	function buildUser(input) { return { name: input.name }; }
	w(buildUser).hasInputs({ name: 'Alice' }).expect.output(hasProperty('role')).assert();
	const suite = await r.run();
	return { suite, specResult: r._tests[0].specResults[0] };
}

function failedWithCorrectSpecName(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.specResult.name,   'has property "role"');
	assert.strictEqual(result.specResult.result, 'fail');
}

when(hasPropertyIntegrationFail)
	.hasInputs({ name: 'hasProperty integration fail', value: null })
	.expect.output(failedWithCorrectSpecName)
	.assert();
