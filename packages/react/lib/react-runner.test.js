'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('@trysquare/core');
const { mount } = require('./mount');
const { userAction } = require('./user-action');
const { withProps, withStubs } = require('./helpers');
const { setupReactRunner } = require('./react-runner');

function makeMockScreen(overrides) {
	return Object.assign({
		getByRole:   () => ({}),
		getByText:   () => ({}),
		queryByText: () => null,
		unmount:     () => {},
	}, overrides);
}

// ── Basic execution ───────────────────────────────────────────────────────────

async function reactRunnerRendersComponent(_) {
	const { runner: r, when: w } = createRunner();
	const mockScreen = makeMockScreen();
	const unsetup = setupReactRunner(r, { renderFn: () => mockScreen });

	function Button() {}
	let received;
	function capturesScreen(screen) { received = screen; }
	w(mount(Button)).hasInputs(withProps('submit button', {})).expect.output(capturesScreen).assert();

	const suite = await r.run();
	unsetup();
	return { passed: suite.passed, receivedIsScreen: received === mockScreen };
}

function reactRunnerRendersComponentCorrect(r) {
	assert.strictEqual(r.passed, 1);
	assert.strictEqual(r.receivedIsScreen, true);
}

when(reactRunnerRendersComponent)
	.hasInputs({ name: 'render result passed to spec', value: null })
	.expect.output(reactRunnerRendersComponentCorrect)
	.assert();

// ── Non-React delegation ──────────────────────────────────────────────────────

async function reactRunnerDelegatesNonReact(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupReactRunner(r, { renderFn: () => makeMockScreen() });

	function double(input) { return input.value * 2; }
	function outputIsTwenty(result) { assert.strictEqual(result, 20); }
	w(double).hasInputs({ name: 'ten', value: 10 }).expect.output(outputIsTwenty).assert();

	const suite = await r.run();
	unsetup();
	return { passed: suite.passed, failed: suite.failed };
}

function reactRunnerDelegatesNonReactCorrect(r) {
	assert.strictEqual(r.passed, 1);
	assert.strictEqual(r.failed, 0);
}

when(reactRunnerDelegatesNonReact)
	.hasInputs({ name: 'non-React test delegated to original runner', value: null })
	.expect.output(reactRunnerDelegatesNonReactCorrect)
	.assert();

// ── Props ─────────────────────────────────────────────────────────────────────

async function reactRunnerPassesProps(_) {
	const { runner: r, when: w } = createRunner();
	let receivedElement;
	const renderFn = (element) => { receivedElement = element; return makeMockScreen(); };
	const unsetup = setupReactRunner(r, { renderFn });

	function Input() {}
	function anySpec() {}
	w(mount(Input))
		.hasInputs(withProps('text input', { placeholder: 'Enter name', disabled: true }))
		.expect.output(anySpec)
		.assert();

	await r.run();
	unsetup();
	return receivedElement ? receivedElement.props : null;
}

function reactRunnerPassesPropsCorrect(props) {
	assert.deepStrictEqual(props, { placeholder: 'Enter name', disabled: true });
}

when(reactRunnerPassesProps)
	.hasInputs({ name: 'props from withProps() passed to render', value: null })
	.expect.output(reactRunnerPassesPropsCorrect)
	.assert();

async function reactRunnerEmptyProps(_) {
	const { runner: r, when: w } = createRunner();
	let receivedElement;
	const renderFn = (element) => { receivedElement = element; return makeMockScreen(); };
	const unsetup = setupReactRunner(r, { renderFn });

	function Icon() {}
	function anySpec() {}
	w(mount(Icon)).hasInputs({ name: 'bare input' }).expect.output(anySpec).assert();

	await r.run();
	unsetup();
	return receivedElement ? receivedElement.props : null;
}

function reactRunnerEmptyPropsCorrect(props) {
	assert.deepStrictEqual(props, {});
}

when(reactRunnerEmptyProps)
	.hasInputs({ name: 'no props key renders with empty props', value: null })
	.expect.output(reactRunnerEmptyPropsCorrect)
	.assert();

// ── Stubs / mocks ─────────────────────────────────────────────────────────────

async function reactRunnerMocksApplied(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupReactRunner(r, { renderFn: () => makeMockScreen() });

	function Widget() {}
	const mockFn = () => 'mocked';
	const stubs = withStubs('mock global', { mocks: { 'global.__reactRunnerMockTest__': mockFn } });

	let seenDuringSpec;
	function capturesMockState() { seenDuringSpec = global.__reactRunnerMockTest__; }
	w(mount(Widget)).hasInputs(withProps('w', {})).stubs(stubs).expect.output(capturesMockState).assert();

	await r.run();
	unsetup();
	return {
		seenDuringSpec: seenDuringSpec === mockFn,
		restoredAfter:  global.__reactRunnerMockTest__ === undefined,
	};
}

function reactRunnerMocksAppliedCorrect(r) {
	assert.strictEqual(r.seenDuringSpec, true);
	assert.strictEqual(r.restoredAfter, true);
}

when(reactRunnerMocksApplied)
	.hasInputs({ name: 'mocks applied before render and restored after', value: null })
	.expect.output(reactRunnerMocksAppliedCorrect)
	.assert();

async function reactRunnerMocksRestoredOnThrow(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupReactRunner(r, { renderFn: () => makeMockScreen() });

	function Widget() {}
	const mockFn = () => {};
	const stubs = withStubs('global mock', { mocks: { 'global.__reactRunnerRestoreTest__': mockFn } });

	function throwingSpec() { throw new Error('spec failed intentionally'); }
	w(mount(Widget)).hasInputs(withProps('w', {})).stubs(stubs).expect.output(throwingSpec).assert();

	await r.run();
	unsetup();
	return global.__reactRunnerRestoreTest__ === undefined;
}

function mockRestoredOnThrowCorrect(restored) {
	assert.strictEqual(restored, true);
}

when(reactRunnerMocksRestoredOnThrow)
	.hasInputs({ name: 'mocks restored even when spec throws', value: null })
	.expect.output(mockRestoredOnThrowCorrect)
	.assert();

// ── User actions ──────────────────────────────────────────────────────────────

async function reactRunnerUserActionsOrder(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupReactRunner(r, { renderFn: () => makeMockScreen() });

	function Form() {}
	const order = [];
	const typesName    = userAction('types name',    async () => { order.push('types name'); });
	const clicksSubmit = userAction('clicks submit', async () => { order.push('clicks submit'); });
	function checksOrder() { order.push('spec'); }

	w(mount(Form)).hasInputs(withProps('form', {}))
		.andUser(typesName)
		.andUser(clicksSubmit)
		.expect.output(checksOrder)
		.assert();

	const suite = await r.run();
	unsetup();
	return { passed: suite.passed, order };
}

function reactRunnerUserActionsOrderCorrect(r) {
	assert.strictEqual(r.passed, 1);
	assert.deepStrictEqual(r.order, ['types name', 'clicks submit', 'spec']);
}

when(reactRunnerUserActionsOrder)
	.hasInputs({ name: 'user actions execute in order before specs', value: null })
	.expect.output(reactRunnerUserActionsOrderCorrect)
	.assert();

async function reactRunnerActionReceivesScreen(_) {
	const { runner: r, when: w } = createRunner();
	const mockScreen = makeMockScreen();
	const unsetup = setupReactRunner(r, { renderFn: () => mockScreen });

	function Form() {}
	let actionReceivedScreen;
	const action = userAction('inspects screen', async (screen) => { actionReceivedScreen = screen; });
	function anySpec() {}
	w(mount(Form)).hasInputs(withProps('form', {})).andUser(action).expect.output(anySpec).assert();

	await r.run();
	unsetup();
	return actionReceivedScreen === mockScreen;
}

function actionReceivesScreenCorrect(received) {
	assert.strictEqual(received, true);
}

when(reactRunnerActionReceivesScreen)
	.hasInputs({ name: 'user action receives render result', value: null })
	.expect.output(actionReceivesScreenCorrect)
	.assert();

// ── Cleanup ───────────────────────────────────────────────────────────────────

async function reactRunnerUnmount(_) {
	const { runner: r, when: w } = createRunner();
	let unmountCalled = false;
	const screen = makeMockScreen({ unmount: () => { unmountCalled = true; } });
	const unsetup = setupReactRunner(r, { renderFn: () => screen });

	function Widget() {}
	function anySpec() {}
	w(mount(Widget)).hasInputs(withProps('w', {})).expect.output(anySpec).assert();

	await r.run();
	unsetup();
	return unmountCalled;
}

function unmountCalledCorrect(called) {
	assert.strictEqual(called, true);
}

when(reactRunnerUnmount)
	.hasInputs({ name: 'unmount called after specs complete', value: null })
	.expect.output(unmountCalledCorrect)
	.assert();

async function reactRunnerUnmountOnThrow(_) {
	const { runner: r, when: w } = createRunner();
	let unmountCalled = false;
	const screen = makeMockScreen({ unmount: () => { unmountCalled = true; } });
	const unsetup = setupReactRunner(r, { renderFn: () => screen });

	function Widget() {}
	function failingSpec() { throw new Error('nope'); }
	w(mount(Widget)).hasInputs(withProps('w', {})).expect.output(failingSpec).assert();

	await r.run();
	unsetup();
	return unmountCalled;
}

when(reactRunnerUnmountOnThrow)
	.hasInputs({ name: 'unmount called even when spec throws', value: null })
	.expect.output(unmountCalledCorrect)
	.assert();

// ── Failure propagation ───────────────────────────────────────────────────────

async function reactRunnerFailingSpec(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupReactRunner(r, { renderFn: () => makeMockScreen() });

	function Widget() {}
	function failingSpec() { throw new Error('assertion failed'); }
	w(mount(Widget)).hasInputs(withProps('w', {})).expect.output(failingSpec).assert();

	const suite = await r.run();
	unsetup();
	return {
		failed:     suite.failed,
		specResult: r._tests[0].specResults[0].result,
		specName:   r._tests[0].specResults[0].name,
	};
}

function reactRunnerFailingSpecCorrect(r) {
	assert.strictEqual(r.failed, 1);
	assert.strictEqual(r.specResult, 'fail');
	assert.strictEqual(r.specName, 'failingSpec');
}

when(reactRunnerFailingSpec)
	.hasInputs({ name: 'failing spec marks test failed', value: null })
	.expect.output(reactRunnerFailingSpecCorrect)
	.assert();

// ── unsetup ───────────────────────────────────────────────────────────────────

function reactRunnerUnsetup(_) {
	const { runner: r } = createRunner();
	const original = r._executeTest;
	const unsetup = setupReactRunner(r, { renderFn: () => makeMockScreen() });
	const afterSetup = r._executeTest;
	unsetup();
	const afterUnsetup = r._executeTest;
	unsetup(); // idempotent
	return {
		wasPatched:  afterSetup !== original,
		wasChanged:  afterUnsetup !== afterSetup,
	};
}

function reactRunnerUnsetupCorrect(r) {
	assert.strictEqual(r.wasPatched, true);
	assert.strictEqual(r.wasChanged, true);
}

when(reactRunnerUnsetup)
	.hasInputs({ name: 'unsetup() restores original _executeTest', value: null })
	.expect.output(reactRunnerUnsetupCorrect)
	.assert();

// ── Missing render function (error path) ─────────────────────────────────────

async function reactRunnerMissingRTL(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupReactRunner(r, {
		renderFn: () => { throw new Error('simulated missing RTL'); },
	});

	function Widget() {}
	function anySpec() {}
	w(mount(Widget)).hasInputs(withProps('w', {})).expect.output(anySpec).assert();

	const suite = await r.run();
	unsetup();
	return {
		failed:  suite.failed,
		message: r._tests[0].error.message,
	};
}

function reactRunnerMissingRTLCorrect(r) {
	assert.strictEqual(r.failed, 1);
	assert.ok(r.message.includes('simulated missing RTL'));
}

when(reactRunnerMissingRTL)
	.hasInputs({ name: 'missing RTL throws clear error', value: null })
	.expect.output(reactRunnerMissingRTLCorrect)
	.assert();
