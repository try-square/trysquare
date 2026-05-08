'use strict';

const { MOUNT_FLAG } = require('./mount');
const { applyMocks } = require('./mocks');

// Patches the given runner instance to handle React component tests created with mount().
//
// Call once before runner.run(). Returns an unsetup function that restores the original runner
// behaviour — useful in test environments where the runner is reset between suites.
//
// options.renderFn — inject a custom render function (defaults to @testing-library/react render).
//   Use this in unit tests to avoid requiring a real DOM environment.
//
// Usage in test files:
//   const { runner } = require('@trysquare/core');
//   const { setupReactRunner } = require('@trysquare/react');
//   setupReactRunner(runner);
//
// Usage in test setup file (setup.js required before tests):
//   const { runner } = require('@trysquare/core');
//   const { setupReactRunner } = require('@trysquare/react');
//   setupReactRunner(runner);
function setupReactRunner(runner, options) {
	const opts = options || {};
	const injectedRenderFn   = opts.renderFn || null;
	const injectedReact      = opts.react     || null;

	function getReact() {
		if (injectedReact) return injectedReact;
		try {
			return require('react');
		} catch (_) {
			throw new Error(
				'[trysquare/react] react not found. Pass { react: require("react") } to setupReactRunner ' +
				'or install react as a devDependency.'
			);
		}
	}

	function getRender() {
		if (injectedRenderFn) return injectedRenderFn;
		try {
			return require('@testing-library/react').render;
		} catch (_) {
			throw new Error(
				'[trysquare/react] @testing-library/react not found. ' +
				'Install it: npm install --save-dev @testing-library/react'
			);
		}
	}

	const originalExecuteTest = runner._executeTest.bind(runner);

	runner._executeTest = async function executeReactTest(test) {
		if (!test.componentFn || !test.componentFn[MOUNT_FLAG]) {
			return originalExecuteTest(test);
		}

		const { createElement } = getReact();
		const render = getRender();
		const Component = test.componentFn[MOUNT_FLAG];
		const props = (test.inputs[0] && test.inputs[0].props) || {};
		const mocks = test.stubs ? (test.stubs.mocks || {}) : {};

		const restore = applyMocks(mocks);
		let renderResult;

		try {
			renderResult = render(createElement(Component, props));

			// Execute user interaction sequence before specs (interaction test type).
			for (const action of test.userActions || []) {
				if (typeof action.execute === 'function') {
					await action.execute(renderResult);
				}
			}

			test._output = renderResult;
			// _executeSpecs is on the Runner prototype — passes renderResult to all specs.
			await runner._executeSpecs(test, renderResult);
		} finally {
			restore();
			// RTL does not have automatic cleanup outside Jest/Vitest — unmount explicitly.
			if (renderResult && typeof renderResult.unmount === 'function') {
				renderResult.unmount();
			}
		}
	};

	function unsetupReactRunner() {
		runner._executeTest = originalExecuteTest;
	}

	return unsetupReactRunner;
}

module.exports = { setupReactRunner };
