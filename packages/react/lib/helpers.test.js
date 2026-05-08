'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { withProps, withStubs } = require('./helpers');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function withPropsBehavior(_) {
	const result   = withProps('submit button', { label: 'Submit', disabled: false });
	const defaults = withProps('empty button');
	return {
		emptyNameThrow: catching(() => withProps('', {})),
		nullNameThrow:  catching(() => withProps(null, {})),
		name:           result.name,
		props:          result.props,
		defaultProps:   defaults.props,
	};
}

function withPropsBehaviorCorrect(r) {
	assert.match(r.emptyNameThrow.message, /non-empty string name/);
	assert.match(r.nullNameThrow.message,  /non-empty string name/);
	assert.strictEqual(r.name, 'submit button');
	assert.deepStrictEqual(r.props, { label: 'Submit', disabled: false });
	assert.deepStrictEqual(r.defaultProps, {});
}

when(withPropsBehavior)
	.hasInputs({ name: 'withProps() behavior', value: null })
	.expect.output(withPropsBehaviorCorrect)
	.assert();

function withStubsBehavior(_) {
	const mockFetch = () => Promise.resolve({ ok: true });
	const result = withStubs('happy path API', {
		mocks:   { 'global.fetch': mockFetch },
		context: { theme: 'dark' },
	});
	const minimal = withStubs('minimal stubs');
	return {
		emptyNameThrow:  catching(() => withStubs('', {})),
		nullNameThrow:   catching(() => withStubs(null)),
		name:            result.name,
		mockFetch:       result.mocks['global.fetch'] === mockFetch,
		context:         result.context,
		contractOk:      typeof result.name === 'string' && result.name.length > 0,
		defaultMocks:    minimal.mocks,
		defaultContext:  minimal.context,
	};
}

function withStubsBehaviorCorrect(r) {
	assert.match(r.emptyNameThrow.message, /non-empty string name/);
	assert.match(r.nullNameThrow.message,  /non-empty string name/);
	assert.strictEqual(r.name, 'happy path API');
	assert.strictEqual(r.mockFetch, true);
	assert.deepStrictEqual(r.context, { theme: 'dark' });
	assert.strictEqual(r.contractOk, true);
	assert.deepStrictEqual(r.defaultMocks, {});
	assert.strictEqual(r.defaultContext, null);
}

when(withStubsBehavior)
	.hasInputs({ name: 'withStubs() behavior', value: null })
	.expect.output(withStubsBehaviorCorrect)
	.assert();
