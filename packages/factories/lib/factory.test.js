'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { factory } = require('./factory');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function factoryBehavior(_) {
	const createMember = factory({ role: 'member', active: true });
	const noDefaults   = factory();
	const guest   = createMember('guest user');
	const admin   = createMember('admin user', { role: 'admin' });
	const nameWin = createMember('correct', { name: 'wrong' });
	const empty   = noDefaults('empty', { x: 1 });
	createMember('first', { extra: 1 });
	const second  = createMember('second');
	const a = createMember('user A', { id: 1 });
	const b = createMember('user B', { id: 2 });
	return {
		isFunction:     typeof createMember === 'function',
		emptyNameThrow: catching(() => createMember('')),
		nullNameThrow:  catching(() => createMember(null)),
		guestName:      guest.name,
		guestRole:      guest.role,
		guestActive:    guest.active,
		adminRole:      admin.role,
		adminActive:    admin.active,
		adminName:      admin.name,
		nameWinsName:   nameWin.name,
		emptyName:      empty.name,
		emptyX:         empty.x,
		noMutate:       second.extra,
		aId: a.id, bId: b.id, aSame: a.role, bSame: b.role,
		distinct:       a !== b,
	};
}

function factoryBehaviorCorrect(r) {
	assert.strictEqual(r.isFunction, true);
	assert.match(r.emptyNameThrow.message, /non-empty string name/);
	assert.match(r.nullNameThrow.message,  /non-empty string name/);
	assert.strictEqual(r.guestName,   'guest user');
	assert.strictEqual(r.guestRole,   'member');
	assert.strictEqual(r.guestActive, true);
	assert.strictEqual(r.adminRole,   'admin');
	assert.strictEqual(r.adminActive, true);
	assert.strictEqual(r.adminName,   'admin user');
	assert.strictEqual(r.nameWinsName,'correct');
	assert.strictEqual(r.emptyName,   'empty');
	assert.strictEqual(r.emptyX,      1);
	assert.strictEqual(r.noMutate,    undefined);
	assert.strictEqual(r.aId, 1); assert.strictEqual(r.bId, 2);
	assert.strictEqual(r.aSame, 'member'); assert.strictEqual(r.bSame, 'member');
	assert.strictEqual(r.distinct, true);
}

when(factoryBehavior)
	.hasInputs({ name: 'factory() behavior', value: null })
	.expect.output(factoryBehaviorCorrect)
	.assert();
