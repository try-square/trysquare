'use strict';

// Creates a named input object carrying React component props.
// The name property is required by the core chain for documentation.
//
// Usage: when(mount(MyButton)).hasInputs(withProps('submit button', { label: 'Submit' }))
function withProps(name, props) {
	if (typeof name !== 'string' || !name) {
		throw new Error('withProps requires a non-empty string name as the first argument.');
	}
	return { name, props: props || {} };
}

// Creates a named stub map compatible with the core .stubs() chain method.
// options.mocks:   { 'global.fetch': mockFn } — applied as globals before component renders
// options.context: arbitrary context value passed to the component wrapper (framework use)
//
// Usage: when(mount(C)).hasInputs(p).stubs(withStubs('failing API', { mocks: { 'global.fetch': failFn } }))
function withStubs(name, options) {
	if (typeof name !== 'string' || !name) {
		throw new Error('withStubs requires a non-empty string name as the first argument.');
	}
	const opts = options || {};
	return {
		name,
		mocks:   opts.mocks   || {},
		context: opts.context || null,
	};
}

module.exports = { withProps, withStubs };
