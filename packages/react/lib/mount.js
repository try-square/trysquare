'use strict';

// Internal symbol used to mark mount() wrappers and carry the original React component.
// Checked by setupReactRunner() to identify React tests.
const MOUNT_FLAG = Symbol('trysquare.react.mount');

// Wraps a React component for use with when().
// The returned function name matches the component for doc generation.
// Actual rendering is handled by setupReactRunner() — this wrapper is never invoked directly.
//
// Usage:
//   when(mount(MyButton))
//     .hasInputs(withProps('submit button', { label: 'Submit' }))
//     .expect.output(isEnabled)
//     .assert();
function mount(Component) {
	if (typeof Component !== 'function') {
		throw new Error(
			'mount() requires a React component (function or class). ' +
			`Received: ${typeof Component}`
		);
	}

	const name = Component.displayName || Component.name || 'Component';

	function mountWrapper() {
		throw new Error(
			`[trysquare/react] ${name} is a React mount wrapper and cannot be called directly. ` +
			'Call setupReactRunner(runner) before runner.run() to enable React test execution.'
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
