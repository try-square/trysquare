'use strict';

// Internal symbol that marks mount() wrappers and carries the original Angular component class.
// Checked by setupAngularRunner() to identify Angular tests.
const MOUNT_FLAG = Symbol('trysquare.angular.mount');

// Wraps an Angular component class for use with when().
// The returned function name matches the component class name for doc generation.
// Actual rendering via TestBed is handled by setupAngularRunner().
//
// Usage:
//   when(mount(MyComponent))
//     .inState(states.ngOnInit)
//     .hasInputs(withInputs('valid user', { userId: '123' }))
//     .stubs(withStubs('mock HTTP', { inject: [{ provide: HttpClient, useValue: mockHttp }] }))
//     .expect.behaviors(showsUserName)
//     .assert();
function mount(Component) {
	if (typeof Component !== 'function') {
		throw new Error(
			'mount() requires an Angular component class. ' +
			`Received: ${typeof Component}`
		);
	}

	const name = Component.name || 'Component';

	function mountWrapper() {
		throw new Error(
			`[trysquare/angular] ${name} is an Angular mount wrapper and cannot be called directly. ` +
			'Call setupAngularRunner(runner) before runner.run() to enable Angular test execution.'
		);
	}

	Object.defineProperty(mountWrapper, 'name', { value: name, configurable: true });
	mountWrapper[MOUNT_FLAG] = Component;

	return mountWrapper;
}

function isMount(fn) {
	return typeof fn === 'function' && fn[MOUNT_FLAG] != null;
}

module.exports = { mount, isMount, MOUNT_FLAG };
