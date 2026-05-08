'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { stub } = require('./stub');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function stubBehavior(_) {
	function HttpClient() {}
	const mockHttp = { get: () => {} };
	const withInject = stub('mock HTTP', { provide: HttpClient, useValue: mockHttp });
	const minimal    = stub('minimal');
	return {
		emptyName:     catching(() => stub('')),
		nullName:      catching(() => stub(null)),
		withInjectName:withInject.name,
		withInjectProv:withInject.inject.provide,
		withInjectVal: withInject.inject.useValue,
		minimalInject: minimal.inject,
		contractName:  typeof minimal.name === 'string' && minimal.name.length > 0,
	};
}

function stubBehaviorCorrect(r) {
	assert.match(r.emptyName.message, /non-empty string name/);
	assert.match(r.nullName.message,  /non-empty string name/);
	assert.strictEqual(r.withInjectName, 'mock HTTP');
	assert.ok(r.withInjectProv, 'provide should be set');
	assert.ok(r.withInjectVal,  'useValue should be set');
	assert.deepStrictEqual(r.minimalInject, {});
	assert.strictEqual(r.contractName, true);
}

when(stubBehavior)
	.hasInputs({ name: 'stub() behavior', value: null })
	.expect.output(stubBehaviorCorrect)
	.assert();
