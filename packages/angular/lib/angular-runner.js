'use strict';

const { MOUNT_FLAG } = require('./mount');

// Angular 14+ standalone components carry ɵcmp.standalone = true.
// Standalone components go in TestBed imports[], not declarations[].
function isStandalone(Component) {
	return !!(Component.ɵcmp && Component.ɵcmp.standalone);
}

function buildTestBedConfig(Component, stubs) {
	const providers = stubs && Array.isArray(stubs.inject)  ? stubs.inject  : [];
	const imports   = stubs && Array.isArray(stubs.imports) ? stubs.imports : [];
	const schemas   = stubs && Array.isArray(stubs.schemas) ? stubs.schemas : [];

	if (isStandalone(Component)) {
		return { imports: [...imports, Component], providers, schemas };
	}
	return { declarations: [Component], imports, providers, schemas };
}

function extractInputs(inputObj) {
	return (inputObj && inputObj.inputs) ? inputObj.inputs : {};
}

// 'created' is the only state that suppresses detectChanges — the component is created but
// ngOnInit has not been triggered. All other states (including no state) run detectChanges.
function shouldDetectChanges(lifecycleState) {
	return !lifecycleState || lifecycleState.name !== 'created';
}

// ngOnDestroy state: run detectChanges first (complete init), then destroy the fixture.
function shouldDestroy(lifecycleState) {
	return !!(lifecycleState && lifecycleState.name === 'ngOnDestroy');
}

function getTestBed() {
	try {
		return require('@angular/core/testing').TestBed;
	} catch (_) {
		throw new Error(
			'[trysquare/angular] @angular/core/testing not found. ' +
			'Install Angular: npm install --save-dev @angular/core @angular/platform-browser-dynamic'
		);
	}
}

// Patches the given runner instance to handle Angular component tests created with mount().
//
// Call once before runner.run(). Returns an unsetup function that restores the original runner
// behaviour — useful in test environments where the runner is reset between suites.
//
// options.fixtureFactory — async (Component, config) => ComponentFixture
//   Inject a custom fixture factory for unit testing without a real Angular environment.
//   config is the TestBed configuration object: { declarations?, imports, providers, schemas }.
//
// Usage:
//   const { runner } = require('@trysquare/core');
//   const { setupAngularRunner } = require('@trysquare/angular');
//   setupAngularRunner(runner);
//
//   // In a test setup file:
//   beforeEach(() => TestBed.resetTestingModule());
function setupAngularRunner(runner, options) {
	const opts = options || {};
	const injectedFixtureFactory = opts.fixtureFactory || null;

	async function createFixture(Component, config) {
		if (injectedFixtureFactory) {
			return injectedFixtureFactory(Component, config);
		}
		const TestBed = getTestBed();
		await TestBed.configureTestingModule(config).compileComponents();
		return TestBed.createComponent(Component);
	}

	function resetTestBed() {
		if (injectedFixtureFactory) return;
		try {
			getTestBed().resetTestingModule();
		} catch (_) {}
	}

	const originalExecuteTest = runner._executeTest.bind(runner);

	runner._executeTest = async function executeAngularTest(test) {
		if (!test.componentFn || !test.componentFn[MOUNT_FLAG]) {
			return originalExecuteTest(test);
		}

		const Component = test.componentFn[MOUNT_FLAG];
		const config = buildTestBedConfig(Component, test.stubs);
		let fixture;

		try {
			fixture = await createFixture(Component, config);

			// Apply @Input() values before triggering change detection.
			const inputs = extractInputs(test.inputs[0]);
			Object.assign(fixture.componentInstance, inputs);

			if (shouldDetectChanges(test.lifecycleState)) {
				fixture.detectChanges();
			}
			// ngOnDestroy: complete init then destroy so ngOnDestroy runs before specs.
			if (shouldDestroy(test.lifecycleState)) {
				fixture.destroy();
			}

			// Execute user interaction sequence before specs.
			for (const action of test.userActions || []) {
				if (typeof action.execute === 'function') {
					await action.execute(fixture);
				}
			}

			test._output = fixture;
			await runner._executeSpecs(test, fixture);
		} finally {
			resetTestBed();
		}
	};

	function unsetupAngularRunner() {
		runner._executeTest = originalExecuteTest;
	}

	return unsetupAngularRunner;
}

module.exports = { setupAngularRunner, buildTestBedConfig, isStandalone };
