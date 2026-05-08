'use strict';

// Decision (section 13 — async spec support): the runner always executes specs as Promises.
// Sync specs are wrapped with Promise.resolve(). .run() always returns a Promise and specs
// can freely be async without a mode switch. This leaves the most architectural flexibility.

// Decision (section 13 — error reporting granularity): specs execute individually.
// Each spec's pass/fail and error are recorded in test.specResults[].
// The first failure throws immediately, stopping remaining specs for that test.

function withTimeout(promise, ms, label) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error(`Test timed out after ${ms}ms (${label})`)),
			ms
		);
		promise.then(
			val => { clearTimeout(timer); resolve(val); },
			err => { clearTimeout(timer); reject(err); }
		);
	});
}

class Runner {
	constructor() {
		this._tests = [];
		this._reporters = [];
		this._mode = 'deferred';
		this._config = {
			execution: 'sequential',
			timeout: 5000,
			retries: 0,
			focusInCIBehavior: 'error',
		};
	}

	configure(config) {
		Object.assign(this._config, config);
		return this;
	}

	// Public API: register a reporter instance.
	register(reporter) {
		this._reporters.push(reporter);
		return this;
	}

	setMode(mode) {
		this._mode = mode;
		return this;
	}

	// Internal: called by scenario.js when .assert() is invoked.
	_addTest(testObj) {
		this._tests.push(testObj);
		if (this._mode === 'immediate') {
			return this._runTest(testObj, false);
		}
	}

	async run() {
		const tests = this._tests.slice();
		const hasFocused = tests.some(t => t.focused);

		if (hasFocused && process.env.CI) {
			const behavior = this._config.focusInCIBehavior || 'error';
			if (behavior === 'error') {
				throw new Error(
					'[trysquare] Focused tests detected in CI environment. ' +
					'Remove .focus() or assert({ only: true }) calls before committing.'
				);
			}
			console.warn('[trysquare] Warning: focused tests detected in CI environment.');
		}

		const suite = {
			tests,
			startTime: Date.now(),
			passed: 0,
			failed: 0,
			skipped: 0,
		};

		this._emit('onSuiteStart', suite);

		if (this._config.execution === 'parallel') {
			await Promise.all(tests.map(t => this._runTest(t, hasFocused)));
		} else if (this._config.execution === 'batch') {
			const batchSize = this._config.batchSize || 10;
			for (let i = 0; i < tests.length; i += batchSize) {
				const batch = tests.slice(i, i + batchSize);
				await Promise.all(batch.map(t => this._runTest(t, hasFocused)));
			}
		} else {
			for (const test of tests) {
				await this._runTest(test, hasFocused);
			}
		}

		suite.endTime = Date.now();
		suite.duration = suite.endTime - suite.startTime;

		for (const test of tests) {
			if (test.result === 'pass') suite.passed++;
			else if (test.result === 'fail') suite.failed++;
			else suite.skipped++;
		}

		this._emit('onSuiteEnd', suite);

		return suite;
	}

	async _runTest(test, hasFocused) {
		const shouldSkip = test.ignored || test.options.skip || (hasFocused && !test.focused);
		if (shouldSkip) {
			test.result = 'skip';
			this._emit('onTestSkip', test);
			return;
		}

		this._emit('onTestStart', test);
		const start = Date.now();

		const retries = test.options.retries != null ? test.options.retries : (this._config.retries || 0);
		const timeout = test.options.timeout != null ? test.options.timeout : this._config.timeout;

		let lastError;
		for (let attempt = 0; attempt <= retries; attempt++) {
			if (attempt > 0) {
				test.specResults = [];
			}
			try {
				const execution = this._executeTest(test);
				await (timeout ? withTimeout(execution, timeout, test.component) : execution);
				test.result = 'pass';
				test.duration = Date.now() - start;
				this._emit('onTestPass', test);
				return;
			} catch (error) {
				lastError = error;
			}
		}

		test.result = 'fail';
		test.duration = Date.now() - start;
		test.error = lastError;
		this._emit('onTestFail', test);
	}

	async _executeTest(test) {
		const output = await this._executeComponent(test);
		test._output = output;
		await this._executeSpecs(test, output);
	}

	async _executeComponent(test) {
		if (test.type !== 'output') {
			// Behavioral and interaction tests: framework extensions handle component execution.
			// Core passes undefined — specs receive it and manage their own setup/assertions.
			return undefined;
		}

		if (typeof test.componentFn !== 'function') {
			throw new Error(
				`Component '${test.component}' is not a function. ` +
				'Type "output" tests require a callable function as the component.'
			);
		}

		// Multiple inputs represent curried application: fn(a)(b)(c)
		let result = test.componentFn;
		for (const input of test.inputs) {
			result = result(input);
		}

		return Promise.resolve(result);
	}

	async _executeSpecs(test, output) {
		const allSpecs = [
			...test.specs.map(s => ({ ...s, category: 'spec' })),
			...test.sideEffects.map(s => ({ ...s, category: 'sideEffect' })),
		];

		test.specResults = [];

		for (const spec of allSpecs) {
			try {
				await Promise.resolve(spec.assert(output));
				test.specResults.push({ name: spec.name, category: spec.category, result: 'pass' });
			} catch (specError) {
				test.specResults.push({ name: spec.name, category: spec.category, result: 'fail', error: specError });
				throw specError;
			}
		}
	}

	_emit(event, ...args) {
		for (const reporter of this._reporters) {
			if (typeof reporter[event] === 'function') {
				try {
					reporter[event](...args);
				} catch (reporterError) {
					console.error(`[trysquare] Reporter error in ${event}:`, reporterError);
				}
			}
		}
	}

	reset() {
		this._tests = [];
		this._reporters = [];
		this._mode = 'deferred';
		this._config = {
			execution: 'sequential',
			timeout: 5000,
			retries: 0,
			focusInCIBehavior: 'error',
		};
	}
}

const singleton = new Runner();
singleton.Runner = Runner;

module.exports = singleton;
