'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { withInputs, withStubs } = require('./helpers');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function withInputsBehavior(_) {
	const result   = withInputs('valid user', { userId: '123', role: 'admin' });
	const defaults = withInputs('empty');
	return {
		emptyNameThrow: catching(() => withInputs('',   {})),
		nullNameThrow:  catching(() => withInputs(null, {})),
		name:           result.name,
		inputs:         result.inputs,
		defaultInputs:  defaults.inputs,
	};
}

function withInputsBehaviorCorrect(r) {
	assert.match(r.emptyNameThrow.message, /non-empty string name/);
	assert.match(r.nullNameThrow.message,  /non-empty string name/);
	assert.strictEqual(r.name, 'valid user');
	assert.deepStrictEqual(r.inputs, { userId: '123', role: 'admin' });
	assert.deepStrictEqual(r.defaultInputs, {});
}

when(withInputsBehavior)
	.hasInputs({ name: 'withInputs() behavior', value: null })
	.expect.output(withInputsBehaviorCorrect)
	.assert();

function withStubsBehavior(_) {
	function HttpClient() {}
	const mockHttp = { get: () => {} };

	const result = withStubs('mock HTTP', {
		inject:  [{ provide: HttpClient, useValue: mockHttp }],
		imports: ['ReactiveFormsModule'],
		schemas: ['NO_ERRORS_SCHEMA'],
	});
	const minimal = withStubs('minimal');
	const badInject = withStubs('bad inject', { inject: 'not an array' });

	return {
		emptyNameThrow:  catching(() => withStubs('',   {})),
		nullNameThrow:   catching(() => withStubs(null)),
		name:            result.name,
		injectLength:    result.inject.length,
		injectProvide:   result.inject[0].provide === HttpClient,
		injectValue:     result.inject[0].useValue === mockHttp,
		imports:         result.imports,
		schemas:         result.schemas,
		contractOk:      typeof result.name === 'string' && result.name.length > 0,
		defaultInject:   minimal.inject,
		defaultImports:  minimal.imports,
		defaultSchemas:  minimal.schemas,
		badInjectFallback: badInject.inject,
	};
}

function withStubsBehaviorCorrect(r) {
	assert.match(r.emptyNameThrow.message, /non-empty string name/);
	assert.match(r.nullNameThrow.message,  /non-empty string name/);
	assert.strictEqual(r.name, 'mock HTTP');
	assert.strictEqual(r.injectLength, 1);
	assert.strictEqual(r.injectProvide, true);
	assert.strictEqual(r.injectValue, true);
	assert.deepStrictEqual(r.imports, ['ReactiveFormsModule']);
	assert.deepStrictEqual(r.schemas, ['NO_ERRORS_SCHEMA']);
	assert.strictEqual(r.contractOk, true);
	assert.deepStrictEqual(r.defaultInject,  []);
	assert.deepStrictEqual(r.defaultImports, []);
	assert.deepStrictEqual(r.defaultSchemas, []);
	assert.deepStrictEqual(r.badInjectFallback, []);
}

when(withStubsBehavior)
	.hasInputs({ name: 'withStubs() behavior', value: null })
	.expect.output(withStubsBehaviorCorrect)
	.assert();
