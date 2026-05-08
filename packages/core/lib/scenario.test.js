'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('../index');

// ── Chain immutability ────────────────────────────────────────────────────────

function branchesFromSameBase(_) {
	function myFn(x) { return x; }
	const base    = when(myFn).hasInputs({ name: 'x' });
	const branch1 = base.stubs({ name: 'stub A', inject: {} });
	const branch2 = base.stubs({ name: 'stub B', inject: {} });
	return { base, branch1, branch2 };
}

function branchesAreDistinctObjects(r) {
	assert.notStrictEqual(r.branch1, r.branch2);
	assert.notStrictEqual(r.branch1, r.base);
}

when(branchesFromSameBase)
	.hasInputs({ name: 'single base', value: null })
	.expect.output(branchesAreDistinctObjects)
	.assert();

// ── _baseId sharing ───────────────────────────────────────────────────────────

function twoStubBranchesFromSameInputs(_) {
	const { runner: r, when: w } = createRunner();
	function myFn(x) { return x; }
	function alwaysPasses() {}
	const base = w(myFn).hasInputs({ name: 'x', value: 1 });
	base.stubs({ name: 'stub A', inject: {} }).expect.behaviors(alwaysPasses).assert();
	base.stubs({ name: 'stub B', inject: {} }).expect.behaviors(alwaysPasses).assert();
	return r._tests;
}

function testsShareBaseId(tests) {
	assert.strictEqual(tests.length, 2);
	assert.strictEqual(tests[0]._baseId, tests[1]._baseId, '_baseId should be shared');
	assert.ok(tests[0]._baseId, '_baseId should be set');
}

when(twoStubBranchesFromSameInputs)
	.hasInputs({ name: 'two branches same base', value: null })
	.expect.output(testsShareBaseId)
	.assert();

// ── Separate hasInputs() produce different _baseIds ───────────────────────────

function twoSeparateInputCalls(_) {
	const { runner: r, when: w } = createRunner();
	function myFn(x) { return x; }
	function alwaysPasses() {}
	w(myFn).hasInputs({ name: 'a' }).expect.behaviors(alwaysPasses).assert();
	w(myFn).hasInputs({ name: 'b' }).expect.behaviors(alwaysPasses).assert();
	return r._tests;
}

function testsHaveDifferentBaseIds(tests) {
	assert.strictEqual(tests.length, 2);
	assert.notStrictEqual(tests[0]._baseId, tests[1]._baseId);
}

when(twoSeparateInputCalls)
	.hasInputs({ name: 'two independent inputs', value: null })
	.expect.output(testsHaveDifferentBaseIds)
	.assert();

// ── focus() propagation ───────────────────────────────────────────────────────

function registerFocusedTest(_) {
	const { runner: r, when: w } = createRunner();
	function myFn(x) { return x; }
	function alwaysPasses() {}
	w(myFn).focus().hasInputs({ name: 'x' }).expect.behaviors(alwaysPasses).assert();
	return r._tests[0];
}

function testIsFocused(test) {
	assert.strictEqual(test.focused, true);
}

when(registerFocusedTest)
	.hasInputs({ name: 'focused test', value: null })
	.expect.output(testIsFocused)
	.assert();

// ── ignore() propagation ──────────────────────────────────────────────────────

function registerIgnoredTest(_) {
	const { runner: r, when: w } = createRunner();
	function myFn(x) { return x; }
	function alwaysPasses() {}
	w(myFn).hasInputs({ name: 'x' }).ignore().expect.behaviors(alwaysPasses).assert();
	return r._tests[0];
}

function testIsIgnored(test) {
	assert.strictEqual(test.ignored, true);
}

when(registerIgnoredTest)
	.hasInputs({ name: 'ignored test', value: null })
	.expect.output(testIsIgnored)
	.assert();

// ── assert({ only: true }) sets focused ───────────────────────────────────────

function registerOnlyTest(_) {
	const { runner: r, when: w } = createRunner();
	function myFn(x) { return x; }
	function alwaysPasses() {}
	w(myFn).hasInputs({ name: 'x' }).expect.behaviors(alwaysPasses).assert({ only: true });
	return r._tests[0];
}

when(registerOnlyTest)
	.hasInputs({ name: 'assert only:true', value: null })
	.expect.output(testIsFocused)
	.assert();

// ── assert({ skip: true }) sets ignored ───────────────────────────────────────

function registerSkippedTest(_) {
	const { runner: r, when: w } = createRunner();
	function myFn(x) { return x; }
	function alwaysPasses() {}
	w(myFn).hasInputs({ name: 'x' }).expect.behaviors(alwaysPasses).assert({ skip: true });
	return r._tests[0];
}

when(registerSkippedTest)
	.hasInputs({ name: 'assert skip:true', value: null })
	.expect.output(testIsIgnored)
	.assert();

// ── Curried function inputs stored in order ───────────────────────────────────

function registerCurriedTest(_) {
	const { runner: r, when: w } = createRunner();
	function add(a) { return b => a.value + b.value; }
	function alwaysPasses() {}
	const a = { name: 'first operand', value: 3 };
	const b = { name: 'second operand', value: 4 };
	w(add, 'curried add').hasInputs(a).andInputs(b).expect.output(alwaysPasses).assert();
	return r._tests[0];
}

function inputsStoredInOrder(test) {
	assert.strictEqual(test.inputs.length, 2);
	assert.strictEqual(test.inputs[0].name, 'first operand');
	assert.strictEqual(test.inputs[1].name, 'second operand');
	assert.strictEqual(test.component, 'curried add');
}

when(registerCurriedTest)
	.hasInputs({ name: 'curried test', value: null })
	.expect.output(inputsStoredInOrder)
	.assert();

// ── isInitialized() lifecycle state ───────────────────────────────────────────

function registerInitializedTest(_) {
	const { runner: r, when: w } = createRunner();
	function MyComponent() {}
	function alwaysPasses() {}
	w(MyComponent).isInitialized().expect.behaviors(alwaysPasses).assert();
	return r._tests[0];
}

function hasInitializedLifecycleState(test) {
	assert.deepStrictEqual(test.lifecycleState, { name: 'initialized' });
}

when(registerInitializedTest)
	.hasInputs({ name: 'isInitialized', value: null })
	.expect.output(hasInitializedLifecycleState)
	.assert();

// ── inState() stores named lifecycle state ────────────────────────────────────

function registerNamedStateTest(_) {
	const { runner: r, when: w } = createRunner();
	function MyComponent() {}
	function alwaysPasses() {}
	w(MyComponent).inState({ name: 'mounted' }).expect.behaviors(alwaysPasses).assert();
	return r._tests[0];
}

function hasMountedState(test) {
	assert.deepStrictEqual(test.lifecycleState, { name: 'mounted' });
}

when(registerNamedStateTest)
	.hasInputs({ name: 'inState mounted', value: null })
	.expect.output(hasMountedState)
	.assert();

// ── andUser() builds ordered action list ──────────────────────────────────────

function registerInteractionTest(_) {
	const { runner: r, when: w } = createRunner();
	function Form() {}
	function alwaysPasses() {}
	const typesEmail   = { name: 'types email' };
	const clicksSubmit = { name: 'clicks submit' };
	w(Form).isInitialized().andUser(typesEmail).andUser(clicksSubmit).expect.behaviors(alwaysPasses).assert();
	return r._tests[0];
}

function hasOrderedUserActions(test) {
	assert.strictEqual(test.userActions.length, 2);
	assert.strictEqual(test.userActions[0].name, 'types email');
	assert.strictEqual(test.userActions[1].name, 'clicks submit');
	assert.strictEqual(test.type, 'interaction');
}

when(registerInteractionTest)
	.hasInputs({ name: 'two user actions', value: null })
	.expect.output(hasOrderedUserActions)
	.assert();

// ── behaviors + sideEffects chaining ─────────────────────────────────────────

function registerBehaviorWithSideEffects(_) {
	const { runner: r, when: w } = createRunner();
	function MyComponent() {}
	function showsError() {}
	function logsEvent() {}
	w(MyComponent).isInitialized().expect.behaviors(showsError).sideEffects(logsEvent).assert();
	return r._tests[0];
}

function hasBothSpecsAndSideEffects(test) {
	assert.strictEqual(test.specs.length, 1);
	assert.strictEqual(test.sideEffects.length, 1);
	assert.strictEqual(test.specs[0].name, 'showsError');
	assert.strictEqual(test.sideEffects[0].name, 'logsEvent');
}

when(registerBehaviorWithSideEffects)
	.hasInputs({ name: 'behaviors with sideEffects', value: null })
	.expect.output(hasBothSpecsAndSideEffects)
	.assert();

// ── stubs stored on test object ───────────────────────────────────────────────

function registerTestWithStubs(_) {
	const { runner: r, when: w } = createRunner();
	function myFn(x) { return x; }
	function alwaysPasses() {}
	const stubMap = { name: 'happy path API', inject: { fetchUser: () => {} } };
	w(myFn).hasInputs({ name: 'x' }).stubs(stubMap).expect.behaviors(alwaysPasses).assert();
	return r._tests[0];
}

function stubsStoredOnTest(test) {
	assert.strictEqual(test.stubs.name, 'happy path API');
}

when(registerTestWithStubs)
	.hasInputs({ name: 'test with stubs', value: null })
	.expect.output(stubsStoredOnTest)
	.assert();
