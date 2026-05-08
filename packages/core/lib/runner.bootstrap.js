'use strict';

// These tests use node:test directly, not the trysquare runner.
//
// A compromised runner could silently pass its own self-tests by skipping spec
// execution or swallowing thrown errors. This file breaks that cycle: node:test
// is an independent harness that cannot be fooled by changes to Runner or makeWhen.
//
// Each test targets one specific attack vector. Keep this file small and focused —
// it is not a duplicate of the self-test suite, just a trust anchor for it.

const test = require('node:test');
const assert = require('node:assert/strict');
const { Runner } = require('./runner');
const { makeWhen } = require('./scenario');

function makeIsolated() {
	const r = new Runner();
	return { r, w: makeWhen(r) };
}

// ── Spec execution ────────────────────────────────────────────────────────────

test('spec function is called', async () => {
	const { r, w } = makeIsolated();
	let called = false;
	function component(_) { return 42; }
	function spec(_) { called = true; }
	w(component).hasInputs({ name: 'x', value: null }).expect.output(spec).assert();
	await r.run();
	assert.strictEqual(called, true);
});

test('spec receives component output', async () => {
	const { r, w } = makeIsolated();
	let received;
	function component(_) { return 'hello'; }
	function spec(output) { received = output; }
	w(component).hasInputs({ name: 'x', value: null }).expect.output(spec).assert();
	await r.run();
	assert.strictEqual(received, 'hello');
});

// ── Failure detection ─────────────────────────────────────────────────────────

test('failing spec marks test as failed', async () => {
	const { r, w } = makeIsolated();
	function component(_) { return 1; }
	function spec(n) { assert.strictEqual(n, 2); }
	w(component).hasInputs({ name: 'x', value: null }).expect.output(spec).assert();
	const suite = await r.run();
	assert.strictEqual(suite.failed, 1);
	assert.strictEqual(suite.passed, 0);
});

test('suite counts reflect actual pass and fail results', async () => {
	const { r, w } = makeIsolated();
	function component(_) { return 1; }
	function passes(_) {}
	function fails(n) { assert.strictEqual(n, 2); }
	w(component).hasInputs({ name: 'pass', value: null }).expect.output(passes).assert();
	w(component).hasInputs({ name: 'fail', value: null }).expect.output(fails).assert();
	const suite = await r.run();
	assert.strictEqual(suite.passed, 1);
	assert.strictEqual(suite.failed, 1);
});

// ── Async paths ───────────────────────────────────────────────────────────────

test('async component is awaited before spec runs', async () => {
	const { r, w } = makeIsolated();
	let received;
	async function component(_) { return 'async-value'; }
	function spec(output) { received = output; }
	w(component).hasInputs({ name: 'x', value: null }).expect.output(spec).assert();
	await r.run();
	assert.strictEqual(received, 'async-value');
});

test('async spec is awaited before test completes', async () => {
	const { r, w } = makeIsolated();
	let sideEffect = false;
	function component(_) { return null; }
	async function spec(_) {
		await new Promise(resolve => setTimeout(resolve, 10));
		sideEffect = true;
	}
	w(component).hasInputs({ name: 'x', value: null }).expect.output(spec).assert();
	await r.run();
	assert.strictEqual(sideEffect, true);
});

// ── Test registration ─────────────────────────────────────────────────────────

test('all registered tests are executed', async () => {
	const { r, w } = makeIsolated();
	const ran = [];
	function component(_) { return null; }
	function specA(_) { ran.push('a'); }
	function specB(_) { ran.push('b'); }
	function specC(_) { ran.push('c'); }
	w(component).hasInputs({ name: 'a', value: null }).expect.output(specA).assert();
	w(component).hasInputs({ name: 'b', value: null }).expect.output(specB).assert();
	w(component).hasInputs({ name: 'c', value: null }).expect.output(specC).assert();
	await r.run();
	assert.deepStrictEqual(ran.sort(), ['a', 'b', 'c']);
});
