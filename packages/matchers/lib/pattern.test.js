'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('@trysquare/core');
const { matches } = require('./pattern');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

// ── matches() ─────────────────────────────────────────────────────────────────

function matchesAll(_) {
	function email(r) { return r.email; }
	return {
		digitName:    matches(/^\d+$/).name,
		flagName:     matches(/hello/i).name,
		passDigits:   catching(() => matches(/^\d+$/).assert('12345')),
		passCase:     catching(() => matches(/hello/i).assert('Hello, world')),
		passLower:    catching(() => matches(/^[a-z]+$/).assert('abc')),
		failDigits:   catching(() => matches(/^\d+$/).assert('abc')),
		failCase:     catching(() => matches(/^hello$/).assert('Hello')),
		nonString:    catching(() => matches(/\d/).assert(42)),
		nullInput:    catching(() => matches(/\d/).assert(null)),
		arrayInput:   catching(() => matches(/\d/).assert([])),
		notRegExp1:   catching(() => matches('/pattern/')),
		notRegExp2:   catching(() => matches(null)),
		namedSel:     matches(/@/, email).name,
		anonSel:      matches(/\d+/, r => r.code).name,
		passSelector: catching(() => matches(/@/, email).assert({ email: 'alice@example.com' })),
		failSelector: catching(() => matches(/@/, email).assert({ email: 'not-an-email' })),
		badSelector:  catching(() => matches(/x/, 'bad')),
	};
}

function matchesBehavior(r) {
	assert.strictEqual(r.digitName, 'matches /^\\d+$/');
	assert.strictEqual(r.flagName,  'matches /hello/i');
	assert.strictEqual(r.passDigits,  null);
	assert.strictEqual(r.passCase,    null);
	assert.strictEqual(r.passLower,   null);
	assert.ok(r.failDigits  instanceof Error);
	assert.ok(r.failCase    instanceof Error);
	assert.match(r.nonString.message,  /expects a string/);
	assert.match(r.nullInput.message,  /expects a string/);
	assert.match(r.arrayInput.message, /expects a string/);
	assert.match(r.notRegExp1.message, /requires a RegExp/);
	assert.match(r.notRegExp2.message, /requires a RegExp/);
	assert.strictEqual(r.namedSel, 'email matches /@/');
	assert.strictEqual(r.anonSel,  'matches /\\d+/');
	assert.strictEqual(r.passSelector, null);
	assert.ok(r.failSelector instanceof Error);
	assert.match(r.badSelector.message, /selector must be a function/);
}

when(matchesAll)
	.hasInputs({ name: 'matches behavior', value: null })
	.expect.output(matchesBehavior)
	.assert();

// ── Integration ───────────────────────────────────────────────────────────────

async function matchesIntegrationPass(_) {
	const { runner: r, when: w } = createRunner();
	function generateId(input) { return `usr-${input.seed}`; }
	w(generateId).hasInputs({ name: 'numeric seed', seed: '0042' }).expect.output(matches(/^usr-\d+$/)).assert();
	return r.run();
}

function hasOnePassing(suite) {
	assert.strictEqual(suite.passed, 1);
}

when(matchesIntegrationPass)
	.hasInputs({ name: 'matches integration pass', value: null })
	.expect.output(hasOnePassing)
	.assert();

async function matchesIntegrationFail(_) {
	const { runner: r, when: w } = createRunner();
	function generateId(input) { return `usr-${input.seed}`; }
	w(generateId).hasInputs({ name: 'alpha seed', seed: 'abc' }).expect.output(matches(/^usr-\d+$/)).assert();
	const suite = await r.run();
	return { suite, specResult: r._tests[0].specResults[0] };
}

function failedWithRegexSpecName(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.specResult.name,   'matches /^usr-\\d+$/');
	assert.strictEqual(result.specResult.result, 'fail');
}

when(matchesIntegrationFail)
	.hasInputs({ name: 'matches integration fail', value: null })
	.expect.output(failedWithRegexSpecName)
	.assert();

async function matchesSelectorSpecName(_) {
	const { runner: r, when: w } = createRunner();
	function register(input) { return { userId: `user-${input.id}`, email: input.email }; }
	function email(res) { return res.email; }
	w(register).hasInputs({ name: 'registration data', id: '123', email: 'alice@example.com' }).expect.output(matches(/.+@.+/, email)).assert();
	const suite = await r.run();
	return { suite, specName: r._tests[0].specResults[0].name };
}

function specNameReflectsSelector(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specName, 'email matches /.+@.+/');
}

when(matchesSelectorSpecName)
	.hasInputs({ name: 'matches selector spec name', value: null })
	.expect.output(specNameReflectsSelector)
	.assert();
