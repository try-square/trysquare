'use strict';

const { runner }             = require('@trysquare/core');
const { setupAngularRunner } = require('@trysquare/angular');

// Lightweight fixture factory — no Angular compiler or TestBed required.
//
// Components declare static deps = [TokenA, TokenB, ...] to specify their
// constructor injection order. The factory resolves each token against the
// provider list built from withStubs({ inject: [...] }).
async function fixtureFactory(Component, config) {
	const providers = (config && config.providers) || [];

	const depMap = new Map(
		providers
			.filter(p => p.provide != null && p.useValue !== undefined)
			.map(p => [p.provide, p.useValue])
	);

	const deps     = (Component.deps || []).map(token => depMap.get(token));
	const instance = new Component(...deps);

	const fixture = {
		componentInstance: instance,
		_initialized: false,
		detectChanges() {
			if (!this._initialized && typeof instance.ngOnInit === 'function') {
				instance.ngOnInit();
			}
			this._initialized = true;
		},
		destroy() {
			if (typeof instance.ngOnDestroy === 'function') {
				instance.ngOnDestroy();
			}
		},
	};

	return fixture;
}

setupAngularRunner(runner, { fixtureFactory });

require('./lib/counter.test');
require('./lib/todo-list.test');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
