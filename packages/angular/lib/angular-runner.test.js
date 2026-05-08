'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('@trysquare/core');
const { mount } = require('./mount');
const { userAction } = require('./user-action');
const { withInputs, withStubs } = require('./helpers');
const { setupAngularRunner, buildTestBedConfig, isStandalone } = require('./angular-runner');
const { states } = require('./states');

function makeMockFixture(overrides) {
	let detectChangesCount = 0;
	let destroyed = false;
	return Object.assign({
		componentInstance:  {},
		nativeElement:      { querySelector: () => null },
		debugElement:       {},
		detectChanges()     { detectChangesCount++; },
		destroy()           { destroyed = true; },
		_detectChangesCount: () => detectChangesCount,
		_isDestroyed:        () => destroyed,
	}, overrides);
}

// ── Basic execution ───────────────────────────────────────────────────────────

async function angularRunnerBasic(_) {
	const { runner: r, when: w } = createRunner();
	const fixture = makeMockFixture();
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => fixture });

	function UserCard() {}
	let received;
	function capturesFixture(f) { received = f; }
	w(mount(UserCard)).hasInputs(withInputs('user data', { name: 'Alice' })).expect.output(capturesFixture).assert();

	const suite = await r.run();
	unsetup();
	return { passed: suite.passed, receivedIsFixture: received === fixture };
}

function angularRunnerBasicCorrect(r) {
	assert.strictEqual(r.passed, 1);
	assert.strictEqual(r.receivedIsFixture, true);
}

when(angularRunnerBasic)
	.hasInputs({ name: 'mount() component passes fixture to spec', value: null })
	.expect.output(angularRunnerBasicCorrect)
	.assert();

async function angularRunnerDelegatesNonAngular(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => makeMockFixture() });

	function double(input) { return input.value * 2; }
	function outputIsTwenty(result) { assert.strictEqual(result, 20); }
	w(double).hasInputs({ name: 'ten', value: 10 }).expect.output(outputIsTwenty).assert();

	const suite = await r.run();
	unsetup();
	return { passed: suite.passed, failed: suite.failed };
}

function angularRunnerDelegatesNonAngularCorrect(r) {
	assert.strictEqual(r.passed, 1);
	assert.strictEqual(r.failed, 0);
}

when(angularRunnerDelegatesNonAngular)
	.hasInputs({ name: 'non-Angular test delegates to original runner', value: null })
	.expect.output(angularRunnerDelegatesNonAngularCorrect)
	.assert();

// ── @Input() application ──────────────────────────────────────────────────────

async function angularRunnerInputs(_) {
	const { runner: r, when: w } = createRunner();
	const fixture = makeMockFixture();
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => fixture });

	function ProfileCard() {}
	function checksInstance(f) {
		assert.strictEqual(f.componentInstance.userId, '42');
		assert.strictEqual(f.componentInstance.role, 'admin');
	}
	w(mount(ProfileCard)).hasInputs(withInputs('admin user', { userId: '42', role: 'admin' })).expect.output(checksInstance).assert();

	const suite = await r.run();
	unsetup();
	return suite.passed;
}

function passedIsOne(passed) { assert.strictEqual(passed, 1); }

when(angularRunnerInputs)
	.hasInputs({ name: '@Input() values assigned before detectChanges', value: null })
	.expect.output(passedIsOne)
	.assert();

async function angularRunnerNoInputsKey(_) {
	const { runner: r, when: w } = createRunner();
	const fixture = makeMockFixture();
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => fixture });

	function Icon() {}
	function anySpec() {}
	w(mount(Icon)).hasInputs({ name: 'bare input' }).expect.output(anySpec).assert();

	await r.run();
	unsetup();
	return Object.keys(fixture.componentInstance).length;
}

function emptyComponentInstance(len) { assert.strictEqual(len, 0); }

when(angularRunnerNoInputsKey)
	.hasInputs({ name: 'no inputs key leaves componentInstance empty', value: null })
	.expect.output(emptyComponentInstance)
	.assert();

// ── Lifecycle triggering ──────────────────────────────────────────────────────

async function angularRunnerLifecycle(_) {
	async function runWithState(state) {
		const { runner: r, when: w } = createRunner();
		const fixture = makeMockFixture();
		const unsetup = setupAngularRunner(r, { fixtureFactory: async () => fixture });
		function Widget() {}
		function anySpec() {}
		if (state) {
			w(mount(Widget)).inState(state).hasInputs(withInputs('w', {})).expect.output(anySpec).assert();
		} else {
			w(mount(Widget)).hasInputs(withInputs('w', {})).expect.output(anySpec).assert();
		}
		await r.run();
		unsetup();
		return { detectChanges: fixture._detectChangesCount(), destroyed: fixture._isDestroyed() };
	}

	const noState     = await runWithState(null);
	const ngOnInit    = await runWithState(states.ngOnInit);
	const ngOnChanges = await runWithState(states.ngOnChanges);
	const created     = await runWithState(states.created);
	const ngOnDestroy = await runWithState(states.ngOnDestroy);

	return { noState, ngOnInit, ngOnChanges, created, ngOnDestroy };
}

function angularRunnerLifecycleCorrect(r) {
	assert.strictEqual(r.noState.detectChanges,     1);
	assert.strictEqual(r.ngOnInit.detectChanges,    1);
	assert.strictEqual(r.ngOnChanges.detectChanges, 1);
	assert.strictEqual(r.created.detectChanges,     0);
	assert.strictEqual(r.ngOnDestroy.detectChanges, 1);
	assert.strictEqual(r.ngOnDestroy.destroyed,     true);
}

when(angularRunnerLifecycle)
	.hasInputs({ name: 'lifecycle state controls detectChanges and destroy', value: null })
	.expect.output(angularRunnerLifecycleCorrect)
	.assert();

// ── TestBed configuration ─────────────────────────────────────────────────────

async function angularRunnerStubsConfig(_) {
	const { runner: r1, when: w1 } = createRunner();
	const configs1 = [];
	const unsetup1 = setupAngularRunner(r1, {
		fixtureFactory: async (Comp, cfg) => { configs1.push(cfg); return makeMockFixture(); },
	});
	function HttpClient() {}
	const mockHttp = { get: () => {} };
	function Widget() {}
	function anySpec() {}
	w1(mount(Widget))
		.hasInputs(withInputs('w', {}))
		.stubs(withStubs('mock HTTP', { inject: [{ provide: HttpClient, useValue: mockHttp }] }))
		.expect.output(anySpec).assert();
	await r1.run();
	unsetup1();

	const { runner: r2, when: w2 } = createRunner();
	const configs2 = [];
	const unsetup2 = setupAngularRunner(r2, {
		fixtureFactory: async (Comp, cfg) => { configs2.push(cfg); return makeMockFixture(); },
	});
	w2(mount(Widget))
		.hasInputs(withInputs('w', {}))
		.stubs(withStubs('with forms', { imports: ['ReactiveFormsModule'] }))
		.expect.output(anySpec).assert();
	await r2.run();
	unsetup2();

	const { runner: r3, when: w3 } = createRunner();
	const configs3 = [];
	const unsetup3 = setupAngularRunner(r3, {
		fixtureFactory: async (Comp, cfg) => { configs3.push(cfg); return makeMockFixture(); },
	});
	w3(mount(Widget))
		.hasInputs(withInputs('w', {}))
		.stubs(withStubs('no errors schema', { schemas: ['NO_ERRORS_SCHEMA'] }))
		.expect.output(anySpec).assert();
	await r3.run();
	unsetup3();

	return {
		providersLength:  configs1[0].providers.length,
		providerProvide:  configs1[0].providers[0].provide === HttpClient,
		imports:          configs2[0].imports,
		schemas:          configs3[0].schemas,
	};
}

function angularRunnerStubsConfigCorrect(r) {
	assert.strictEqual(r.providersLength, 1);
	assert.strictEqual(r.providerProvide, true);
	assert.deepStrictEqual(r.imports, ['ReactiveFormsModule']);
	assert.deepStrictEqual(r.schemas, ['NO_ERRORS_SCHEMA']);
}

when(angularRunnerStubsConfig)
	.hasInputs({ name: 'stubs providers/imports/schemas passed to fixtureFactory', value: null })
	.expect.output(angularRunnerStubsConfigCorrect)
	.assert();

async function angularRunnerStandaloneConfig(_) {
	const { runner: r1, when: w1 } = createRunner();
	const configs1 = [];
	const unsetup1 = setupAngularRunner(r1, {
		fixtureFactory: async (Comp, cfg) => { configs1.push({ Comp, cfg }); return makeMockFixture(); },
	});
	function Widget() {}
	function anySpec() {}
	w1(mount(Widget)).hasInputs(withInputs('w', {})).expect.output(anySpec).assert();
	await r1.run();
	unsetup1();

	const { runner: r2, when: w2 } = createRunner();
	const configs2 = [];
	const unsetup2 = setupAngularRunner(r2, {
		fixtureFactory: async (Comp, cfg) => { configs2.push({ Comp, cfg }); return makeMockFixture(); },
	});
	function StandaloneWidget() {}
	StandaloneWidget.ɵcmp = { standalone: true };
	w2(mount(StandaloneWidget)).hasInputs(withInputs('w', {})).expect.output(anySpec).assert();
	await r2.run();
	unsetup2();

	return {
		nonStandaloneDeclarations: configs1[0].cfg.declarations.includes(Widget),
		nonStandaloneNoCompInImports: !(configs1[0].cfg.imports || []).includes(Widget),
		standaloneImports:            configs2[0].cfg.imports.includes(StandaloneWidget),
		standaloneNoDeclarations:     !configs2[0].cfg.declarations,
	};
}

function angularRunnerStandaloneConfigCorrect(r) {
	assert.strictEqual(r.nonStandaloneDeclarations, true);
	assert.strictEqual(r.nonStandaloneNoCompInImports, true);
	assert.strictEqual(r.standaloneImports, true);
	assert.strictEqual(r.standaloneNoDeclarations, true);
}

when(angularRunnerStandaloneConfig)
	.hasInputs({ name: 'declarations vs imports for standalone vs module components', value: null })
	.expect.output(angularRunnerStandaloneConfigCorrect)
	.assert();

// ── User actions ──────────────────────────────────────────────────────────────

async function angularRunnerUserActions(_) {
	const { runner: r, when: w } = createRunner();
	const fixture = makeMockFixture();
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => fixture });

	function FormComponent() {}
	const order = [];
	const typesEmail   = userAction('types email',   async () => { order.push('types email'); });
	const clicksSubmit = userAction('clicks submit', async () => { order.push('clicks submit'); });
	function checksOrder() { order.push('spec'); }

	w(mount(FormComponent))
		.hasInputs(withInputs('empty form', {}))
		.andUser(typesEmail)
		.andUser(clicksSubmit)
		.expect.output(checksOrder)
		.assert();

	const suite = await r.run();
	unsetup();
	return { passed: suite.passed, order };
}

function angularRunnerUserActionsCorrect(r) {
	assert.strictEqual(r.passed, 1);
	assert.deepStrictEqual(r.order, ['types email', 'clicks submit', 'spec']);
}

when(angularRunnerUserActions)
	.hasInputs({ name: 'user actions in order before specs', value: null })
	.expect.output(angularRunnerUserActionsCorrect)
	.assert();

async function angularRunnerActionReceivesFixture(_) {
	const { runner: r, when: w } = createRunner();
	const fixture = makeMockFixture();
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => fixture });

	function FormComponent() {}
	let actionReceivedFixture;
	const action = userAction('inspects fixture', async (f) => { actionReceivedFixture = f; });
	function anySpec() {}

	w(mount(FormComponent)).hasInputs(withInputs('form', {})).andUser(action).expect.output(anySpec).assert();

	await r.run();
	unsetup();
	return actionReceivedFixture === fixture;
}

function actionReceivesFixtureCorrect(received) {
	assert.strictEqual(received, true);
}

when(angularRunnerActionReceivesFixture)
	.hasInputs({ name: 'user action receives the fixture', value: null })
	.expect.output(actionReceivesFixtureCorrect)
	.assert();

// ── Failure propagation ───────────────────────────────────────────────────────

async function angularRunnerFailingSpec(_) {
	const { runner: r, when: w } = createRunner();
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => makeMockFixture() });

	function Widget() {}
	function failingSpec() { throw new Error('assertion failed'); }
	w(mount(Widget)).hasInputs(withInputs('w', {})).expect.output(failingSpec).assert();

	const suite = await r.run();
	unsetup();
	return {
		failed:     suite.failed,
		specResult: r._tests[0].specResults[0].result,
		specName:   r._tests[0].specResults[0].name,
	};
}

function angularRunnerFailingSpecCorrect(r) {
	assert.strictEqual(r.failed, 1);
	assert.strictEqual(r.specResult, 'fail');
	assert.strictEqual(r.specName, 'failingSpec');
}

when(angularRunnerFailingSpec)
	.hasInputs({ name: 'failing spec marks test failed', value: null })
	.expect.output(angularRunnerFailingSpecCorrect)
	.assert();

// ── fixtureFactory call count ─────────────────────────────────────────────────

async function angularRunnerFixtureCount(_) {
	const { runner: r, when: w } = createRunner();
	let callCount = 0;
	const unsetup = setupAngularRunner(r, {
		fixtureFactory: async () => { callCount++; return makeMockFixture(); },
	});

	function Widget() {}
	function anySpec() {}
	w(mount(Widget)).hasInputs(withInputs('w1', {})).expect.output(anySpec).assert();
	w(mount(Widget)).hasInputs(withInputs('w2', {})).expect.output(anySpec).assert();

	await r.run();
	unsetup();
	return callCount;
}

function fixtureCountIsTwo(count) {
	assert.strictEqual(count, 2);
}

when(angularRunnerFixtureCount)
	.hasInputs({ name: 'fixtureFactory called once per test', value: null })
	.expect.output(fixtureCountIsTwo)
	.assert();

// ── buildTestBedConfig ────────────────────────────────────────────────────────

function buildTestBedConfigBehavior(_) {
	function MyComp() {}
	function Standalone() {}
	Standalone.ɵcmp = { standalone: true };
	const stubs = withStubs('with forms', { imports: ['ReactiveFormsModule'] });

	const nonStandalone          = buildTestBedConfig(MyComp, null);
	const standaloneNoStubs      = buildTestBedConfig(Standalone, null);
	const standaloneWithStubs    = buildTestBedConfig(Standalone, stubs);

	return {
		nonStandaloneDeclarations: nonStandalone.declarations.includes(MyComp),
		nonStandaloneNoImportsComp: !(nonStandalone.imports || []).includes(MyComp),
		standaloneImports:         standaloneNoStubs.imports.includes(Standalone),
		standaloneNoDeclarations:  !standaloneNoStubs.declarations,
		mergedImports:             standaloneWithStubs.imports.includes('ReactiveFormsModule') && standaloneWithStubs.imports.includes(Standalone),
		nullProviders:             nonStandalone.providers,
		nullImports:               nonStandalone.imports,
		nullSchemas:               nonStandalone.schemas,
	};
}

function buildTestBedConfigBehaviorCorrect(r) {
	assert.strictEqual(r.nonStandaloneDeclarations, true);
	assert.strictEqual(r.nonStandaloneNoImportsComp, true);
	assert.strictEqual(r.standaloneImports, true);
	assert.strictEqual(r.standaloneNoDeclarations, true);
	assert.strictEqual(r.mergedImports, true);
	assert.deepStrictEqual(r.nullProviders, []);
	assert.deepStrictEqual(r.nullImports,   []);
	assert.deepStrictEqual(r.nullSchemas,   []);
}

when(buildTestBedConfigBehavior)
	.hasInputs({ name: 'buildTestBedConfig() behavior', value: null })
	.expect.output(buildTestBedConfigBehaviorCorrect)
	.assert();

// ── isStandalone ──────────────────────────────────────────────────────────────

function isStandaloneBehavior(_) {
	function Comp() {}
	function StandaloneComp() {}
	StandaloneComp.ɵcmp = { standalone: true };
	function NonStandaloneComp() {}
	NonStandaloneComp.ɵcmp = { standalone: false };

	return {
		trueForStandalone:     isStandalone(StandaloneComp),
		falseForTraditional:   isStandalone(Comp),
		falseForNonStandalone: isStandalone(NonStandaloneComp),
	};
}

function isStandaloneBehaviorCorrect(r) {
	assert.strictEqual(r.trueForStandalone,     true);
	assert.strictEqual(r.falseForTraditional,   false);
	assert.strictEqual(r.falseForNonStandalone, false);
}

when(isStandaloneBehavior)
	.hasInputs({ name: 'isStandalone() behavior', value: null })
	.expect.output(isStandaloneBehaviorCorrect)
	.assert();

// ── unsetup ───────────────────────────────────────────────────────────────────

async function angularRunnerUnsetup(_) {
	const { runner: r, when: w } = createRunner();
	const original = r._executeTest;
	const unsetup = setupAngularRunner(r, { fixtureFactory: async () => makeMockFixture() });
	const afterSetup = r._executeTest;
	unsetup();
	const afterUnsetup = r._executeTest;

	// Plain function test should work normally after unsetup
	function identity(input) { return input.value; }
	function checksValue(result) { assert.strictEqual(result, 99); }
	w(identity).hasInputs({ name: 'x', value: 99 }).expect.output(checksValue).assert();

	const suite = await r.run();
	return {
		wasPatched:  afterSetup !== original,
		wasChanged:  afterUnsetup !== afterSetup,
		passed:      suite.passed,
	};
}

function angularRunnerUnsetupCorrect(r) {
	assert.strictEqual(r.wasPatched, true);
	assert.strictEqual(r.wasChanged, true);
	assert.strictEqual(r.passed, 1);
}

when(angularRunnerUnsetup)
	.hasInputs({ name: 'unsetup() restores _executeTest', value: null })
	.expect.output(angularRunnerUnsetupCorrect)
	.assert();
