'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { input } = require('./input');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function inputBehavior(_) {
	return {
		emptyName:  catching(() => input('', {})),
		nullName:   catching(() => input(null, {})),
		numberName: catching(() => input(42, {})),
		withFields: input('valid user', { userId: '42', role: 'admin' }),
		bare:       input('bare'),
		nameWins:   input('correct name', { name: 'wrong name', value: 1 }),
	};
}

function inputBehaviorCorrect(r) {
	assert.match(r.emptyName.message,  /non-empty string name/);
	assert.match(r.nullName.message,   /non-empty string name/);
	assert.match(r.numberName.message, /non-empty string name/);
	assert.strictEqual(r.withFields.name,   'valid user');
	assert.strictEqual(r.withFields.userId, '42');
	assert.strictEqual(r.withFields.role,   'admin');
	assert.strictEqual(r.bare.name, 'bare');
	assert.deepStrictEqual(Object.keys(r.bare), ['name']);
	assert.strictEqual(r.nameWins.name,  'correct name');
	assert.strictEqual(r.nameWins.value, 1);
	assert.ok(typeof r.withFields.name === 'string' && r.withFields.name.length > 0);
}

when(inputBehavior)
	.hasInputs({ name: 'input() behavior', value: null })
	.expect.output(inputBehaviorCorrect)
	.assert();
