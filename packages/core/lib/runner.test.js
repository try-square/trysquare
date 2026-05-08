'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('../index');

// Each test function creates an isolated { runner, when } pair via createRunner(),
// registers sub-scenarios on it, runs it, and returns the suite for inspection.

// ── Pure function tests ───────────────────────────────────────────────────────

async function suiteWithPassingSpec(_) {
	const { runner: r, when: w } = createRunner();
	function double(input) { return input.value * 2; }
	function outputIsTwenty(result) { assert.strictEqual(result, 20); }
	w(double).hasInputs({ name: 'ten', value: 10 }).expect.output(outputIsTwenty).assert();
	return r.run();
}

function hasSinglePassing(suite) {
	assert.strictEqual(suite.passed, 1);
	assert.strictEqual(suite.failed, 0);
}

when(suiteWithPassingSpec)
	.hasInputs({ name: 'passing pure spec', value: null })
	.expect.output(hasSinglePassing)
	.assert();

// ─────────────────────────────────────────────────────────────────────────────

async function suiteWithFailingSpec(_) {
	const { runner: r, when: w } = createRunner();
	function double(input) { return input.value * 2; }
	function outputIsForty(result) { assert.strictEqual(result, 40, 'expected 40'); }
	w(double).hasInputs({ name: 'ten', value: 10 }).expect.output(outputIsForty).assert();
	return r.run();
}

function hasSingleFailing(suite) {
	assert.strictEqual(suite.passed, 0);
	assert.strictEqual(suite.failed, 1);
}

when(suiteWithFailingSpec)
	.hasInputs({ name: 'failing pure spec', value: null })
	.expect.output(hasSingleFailing)
	.assert();

// ── Curried function ──────────────────────────────────────────────────────────

async function suiteWithCurriedFn(_) {
	const { runner: r, when: w } = createRunner();
	function add(a) { return b => a.value + b.value; }
	function sumIsSeven(result) { assert.strictEqual(result, 7); }
	w(add, 'curried add').hasInputs({ name: 'three', value: 3 }).andInputs({ name: 'four', value: 4 }).expect.output(sumIsSeven).assert();
	return r.run();
}

when(suiteWithCurriedFn)
	.hasInputs({ name: 'curried add', value: null })
	.expect.output(hasSinglePassing)
	.assert();

// ── Async spec ────────────────────────────────────────────────────────────────

async function suiteWithAsyncSpec(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return Promise.resolve(input.value); }
	async function outputIsOne(result) { assert.strictEqual(await result, 1); }
	w(identity).hasInputs({ name: 'one', value: 1 }).expect.output(outputIsOne).assert();
	return r.run();
}

when(suiteWithAsyncSpec)
	.hasInputs({ name: 'async spec', value: null })
	.expect.output(hasSinglePassing)
	.assert();

// ── Per-spec results ──────────────────────────────────────────────────────────

async function suiteWithMixedSpecResults(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return input.value; }
	function isPositive(result) { assert.ok(result > 0); }
	function isAboveTen(result) { assert.ok(result > 10, 'expected > 10'); }
	w(identity).hasInputs({ name: 'five', value: 5 }).expect.output(isPositive, isAboveTen).assert();
	const suite = await r.run();
	return { suite, specResults: r._tests[0].specResults };
}

function firstPassesSecondFails(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.specResults[0].result, 'pass');
	assert.strictEqual(result.specResults[0].name, 'isPositive');
	assert.strictEqual(result.specResults[1].result, 'fail');
	assert.strictEqual(result.specResults[1].name, 'isAboveTen');
}

when(suiteWithMixedSpecResults)
	.hasInputs({ name: 'mixed spec results', value: null })
	.expect.output(firstPassesSecondFails)
	.assert();

// ── Focus ─────────────────────────────────────────────────────────────────────

async function suiteWithFocusedTest(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return input.value; }
	function alwaysPasses() {}
	function alwaysFails() { throw new Error('should not run'); }
	w(identity).hasInputs({ name: 'a', value: 1 }).focus().expect.output(alwaysPasses).assert();
	w(identity).hasInputs({ name: 'b', value: 2 }).expect.output(alwaysFails).assert();
	return r.run();
}

function onlyFocusedRan(suite) {
	assert.strictEqual(suite.passed, 1);
	assert.strictEqual(suite.skipped, 1);
	assert.strictEqual(suite.failed, 0);
}

when(suiteWithFocusedTest)
	.hasInputs({ name: 'one focused test', value: null })
	.expect.output(onlyFocusedRan)
	.assert();

// ── Ignore ────────────────────────────────────────────────────────────────────

async function suiteWithIgnoredTest(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return input.value; }
	function alwaysFails() { throw new Error('should not run'); }
	w(identity).hasInputs({ name: 'a', value: 1 }).ignore().expect.output(alwaysFails).assert();
	return r.run();
}

function testWasSkipped(suite) {
	assert.strictEqual(suite.skipped, 1);
	assert.strictEqual(suite.failed, 0);
}

when(suiteWithIgnoredTest)
	.hasInputs({ name: 'ignored test', value: null })
	.expect.output(testWasSkipped)
	.assert();

// ── assert({ skip: true }) ────────────────────────────────────────────────────

async function suiteWithSkipOption(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return input.value; }
	function alwaysFails() { throw new Error('should not run'); }
	w(identity).hasInputs({ name: 'a', value: 1 }).expect.output(alwaysFails).assert({ skip: true });
	return r.run();
}

when(suiteWithSkipOption)
	.hasInputs({ name: 'assert skip:true', value: null })
	.expect.output(testWasSkipped)
	.assert();

// ── assert({ only: true }) ────────────────────────────────────────────────────

async function suiteWithOnlyOption(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return input.value; }
	function alwaysPasses() {}
	function alwaysFails() { throw new Error('should not run'); }
	w(identity).hasInputs({ name: 'a', value: 1 }).expect.output(alwaysPasses).assert({ only: true });
	w(identity).hasInputs({ name: 'b', value: 2 }).expect.output(alwaysFails).assert();
	return r.run();
}

when(suiteWithOnlyOption)
	.hasInputs({ name: 'assert only:true', value: null })
	.expect.output(onlyFocusedRan)
	.assert();

// ── Side effects run after behavioral specs ───────────────────────────────────

async function suiteWithSideEffect(_) {
	const { runner: r, when: w } = createRunner();
	const tracking = { called: false };
	function MyComponent() {}
	function checksBehavior() {}
	function recordsSideEffect() { tracking.called = true; }
	w(MyComponent).isInitialized().expect.behaviors(checksBehavior).sideEffects(recordsSideEffect).assert();
	const suite = await r.run();
	return { suite, tracking };
}

function sideEffectRan(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.tracking.called, true);
}

when(suiteWithSideEffect)
	.hasInputs({ name: 'side effect test', value: null })
	.expect.output(sideEffectRan)
	.assert();

// ── Multiple tests ────────────────────────────────────────────────────────────

async function suiteWithTwoTests(_) {
	const { runner: r, when: w } = createRunner();
	function double(input) { return input.value * 2; }
	function outputIsFour(result) { assert.strictEqual(result, 4); }
	function outputIsSix(result)  { assert.strictEqual(result, 6); }
	w(double).hasInputs({ name: 'two',   value: 2 }).expect.output(outputIsFour).assert();
	w(double).hasInputs({ name: 'three', value: 3 }).expect.output(outputIsSix).assert();
	return r.run();
}

function hasTwoPassing(suite) {
	assert.strictEqual(suite.passed, 2);
	assert.strictEqual(suite.failed, 0);
}

when(suiteWithTwoTests)
	.hasInputs({ name: 'two tests', value: null })
	.expect.output(hasTwoPassing)
	.assert();

// ── Parallel execution ────────────────────────────────────────────────────────

async function suiteInParallelMode(_) {
	const { runner: r, when: w } = createRunner();
	r.configure({ execution: 'parallel' });
	function double(input) { return input.value * 2; }
	function outputIsFour(result) { assert.strictEqual(result, 4); }
	function outputIsSix(result)  { assert.strictEqual(result, 6); }
	w(double).hasInputs({ name: 'two',   value: 2 }).expect.output(outputIsFour).assert();
	w(double).hasInputs({ name: 'three', value: 3 }).expect.output(outputIsSix).assert();
	return r.run();
}

when(suiteInParallelMode)
	.hasInputs({ name: 'parallel execution', value: null })
	.expect.output(hasTwoPassing)
	.assert();

// ── Reusable base scenario ────────────────────────────────────────────────────

async function suiteWithReusableBase(_) {
	const { runner: r, when: w } = createRunner();
	function greet(input) { return `Hello, ${input.name}!`; }
	const base = w(greet).hasInputs({ name: 'Alice' });
	function greetsAlice(result) { assert.strictEqual(result, 'Hello, Alice!'); }
	function isAString(result)   { assert.strictEqual(typeof result, 'string'); }
	base.expect.output(greetsAlice).assert();
	base.expect.output(isAString).assert();
	const suite = await r.run();
	return { suite, tests: r._tests };
}

function twoBranchesShareBaseId(result) {
	assert.strictEqual(result.suite.passed, 2);
	assert.strictEqual(result.tests[0]._baseId, result.tests[1]._baseId);
}

when(suiteWithReusableBase)
	.hasInputs({ name: 'reusable base', value: null })
	.expect.output(twoBranchesShareBaseId)
	.assert();

// ── Reporter events ───────────────────────────────────────────────────────────

async function suiteWithReporter(_) {
	const { runner: r, when: w } = createRunner();
	const events = [];
	r.register({
		onSuiteStart() { events.push('suiteStart'); },
		onTestPass()   { events.push('pass'); },
		onSuiteEnd()   { events.push('suiteEnd'); },
	});
	function identity(input) { return input.value; }
	function checksValue(result) { assert.strictEqual(result, 1); }
	w(identity).hasInputs({ name: 'x', value: 1 }).expect.output(checksValue).assert();
	await r.run();
	return events;
}

function emittedCorrectEvents(events) {
	assert.deepStrictEqual(events, ['suiteStart', 'pass', 'suiteEnd']);
}

when(suiteWithReporter)
	.hasInputs({ name: 'reporter events', value: null })
	.expect.output(emittedCorrectEvents)
	.assert();

// ── Timeout ───────────────────────────────────────────────────────────────────

async function suiteWithSlowSpec(_) {
	const { runner: r, when: w } = createRunner();
	r.configure({ timeout: 50 });
	function slowFn() { return new Promise(resolve => setTimeout(() => resolve(42), 500)); }
	function checksResult() {}
	w(slowFn).hasInputs({ name: 'input', value: 1 }).expect.output(checksResult).assert();
	const suite = await r.run();
	return { suite, error: r._tests[0].error };
}

function timedOut(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.ok(result.error.message.includes('timed out'), result.error.message);
}

when(suiteWithSlowSpec)
	.hasInputs({ name: 'timeout 50ms', value: null })
	.expect.output(timedOut)
	.assert({ timeout: 2000 });

// ── Per-test timeout override ─────────────────────────────────────────────────

async function suiteWithPerTestTimeout(_) {
	const { runner: r, when: w } = createRunner();
	r.configure({ timeout: 500 });
	function slowFn() { return new Promise(resolve => setTimeout(() => resolve(42), 200)); }
	function checksResult() {}
	w(slowFn).hasInputs({ name: 'input', value: 1 }).expect.output(checksResult).assert({ timeout: 50 });
	const suite = await r.run();
	return { suite, error: r._tests[0].error };
}

when(suiteWithPerTestTimeout)
	.hasInputs({ name: 'per-test timeout override', value: null })
	.expect.output(timedOut)
	.assert({ timeout: 2000 });

// ── Retries — succeeds on last attempt ───────────────────────────────────────

async function suiteWithRetries(_) {
	const { runner: r, when: w } = createRunner();
	r.configure({ retries: 2 });
	let attempts = 0;
	function identity(input) { return input.value; }
	function failsTwiceThenPasses() {
		attempts++;
		if (attempts < 3) throw new Error('not yet');
	}
	w(identity).hasInputs({ name: 'input', value: 1 }).expect.output(failsTwiceThenPasses).assert();
	const suite = await r.run();
	return { suite, attempts };
}

function passedAfterThreeAttempts(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.suite.failed, 0);
	assert.strictEqual(result.attempts, 3);
}

when(suiteWithRetries)
	.hasInputs({ name: 'retries succeed on third', value: null })
	.expect.output(passedAfterThreeAttempts)
	.assert();

// ── Retries exhausted ─────────────────────────────────────────────────────────

async function suiteWithExhaustedRetries(_) {
	const { runner: r, when: w } = createRunner();
	r.configure({ retries: 2 });
	let attempts = 0;
	function identity(input) { return input.value; }
	function alwaysFails() { attempts++; throw new Error('always fails'); }
	w(identity).hasInputs({ name: 'input', value: 1 }).expect.output(alwaysFails).assert();
	const suite = await r.run();
	return { suite, attempts };
}

function failedAfterThreeAttempts(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.attempts, 3);
}

when(suiteWithExhaustedRetries)
	.hasInputs({ name: 'retries exhausted', value: null })
	.expect.output(failedAfterThreeAttempts)
	.assert();

// ── Per-test retry override ───────────────────────────────────────────────────

async function suiteWithPerTestRetry(_) {
	const { runner: r, when: w } = createRunner();
	r.configure({ retries: 0 });
	let attempts = 0;
	function identity(input) { return input.value; }
	function failsTwiceThenPasses() {
		attempts++;
		if (attempts < 3) throw new Error('not yet');
	}
	w(identity).hasInputs({ name: 'input', value: 1 }).expect.output(failsTwiceThenPasses).assert({ retries: 2 });
	const suite = await r.run();
	return { suite, attempts };
}

when(suiteWithPerTestRetry)
	.hasInputs({ name: 'per-test retry override', value: null })
	.expect.output(passedAfterThreeAttempts)
	.assert();

// ── .output().sideEffects() on pure function ──────────────────────────────────

async function suiteWithOutputSideEffect(_) {
	const { runner: r, when: w } = createRunner();
	let called = false;
	function double(input) { return input.value * 2; }
	function outputIsTen(result) { assert.strictEqual(result, 10); }
	function recordsSideEffect() { called = true; }
	w(double).hasInputs({ name: 'five', value: 5 }).expect.output(outputIsTen).sideEffects(recordsSideEffect).assert();
	const suite = await r.run();
	return { suite, called };
}

function outputSideEffectRan(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.called, true);
}

when(suiteWithOutputSideEffect)
	.hasInputs({ name: 'output+sideEffects pass', value: null })
	.expect.output(outputSideEffectRan)
	.assert();

// ── Failing side effect marks test failed ─────────────────────────────────────

async function suiteWithFailingSideEffect(_) {
	const { runner: r, when: w } = createRunner();
	function identity(input) { return input.value; }
	function outputIsOne(result) { assert.strictEqual(result, 1); }
	function failingSideEffect() { throw new Error('side effect failed'); }
	w(identity).hasInputs({ name: 'one', value: 1 }).expect.output(outputIsOne).sideEffects(failingSideEffect).assert();
	const suite = await r.run();
	return { suite, specResults: r._tests[0].specResults };
}

function sideEffectFailureRecorded(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.specResults[0].result, 'pass');
	assert.strictEqual(result.specResults[1].result, 'fail');
}

when(suiteWithFailingSideEffect)
	.hasInputs({ name: 'failing side effect', value: null })
	.expect.output(sideEffectFailureRecorded)
	.assert();

// ── Chained .sideEffects() accumulate ────────────────────────────────────────

async function suiteWithChainedSideEffects(_) {
	const { runner: r, when: w } = createRunner();
	const calls = [];
	function identity(input) { return input.value; }
	function firstEffect()  { calls.push('first'); }
	function secondEffect() { calls.push('second'); }
	w(identity).hasInputs({ name: 'input', value: 1 }).expect.output().sideEffects(firstEffect).sideEffects(secondEffect).assert();
	await r.run();
	return calls;
}

function sideEffectsRanInOrder(calls) {
	assert.deepStrictEqual(calls, ['first', 'second']);
}

when(suiteWithChainedSideEffects)
	.hasInputs({ name: 'chained sideEffects', value: null })
	.expect.output(sideEffectsRanInOrder)
	.assert();
