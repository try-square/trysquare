'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { userAction } = require('./user-action');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function userActionBehavior(_) {
	const fn     = async () => {};
	const action = userAction('clicks submit', fn);
	return {
		emptyNameThrow:    catching(() => userAction('', () => {})),
		nullNameThrow:     catching(() => userAction(null, () => {})),
		numberNameThrow:   catching(() => userAction(42, () => {})),
		stringExecThrow:   catching(() => userAction('clicks submit', 'not a function')),
		nullExecThrow:     catching(() => userAction('clicks submit', null)),
		name:              action.name,
		executeIsOriginal: action.execute === fn,
	};
}

function userActionBehaviorCorrect(r) {
	assert.match(r.emptyNameThrow.message,  /non-empty string name/);
	assert.match(r.nullNameThrow.message,   /non-empty string name/);
	assert.match(r.numberNameThrow.message, /non-empty string name/);
	assert.match(r.stringExecThrow.message, /execute function/);
	assert.match(r.nullExecThrow.message,   /execute function/);
	assert.strictEqual(r.name, 'clicks submit');
	assert.strictEqual(r.executeIsOriginal, true);
}

when(userActionBehavior)
	.hasInputs({ name: 'userAction() behavior', value: null })
	.expect.output(userActionBehaviorCorrect)
	.assert();

async function userActionCallable(_) {
	let called = false;
	const action = userAction('presses enter', async () => { called = true; });
	await action.execute();
	return called;
}

function calledIsTrue(called) {
	assert.strictEqual(called, true);
}

when(userActionCallable)
	.hasInputs({ name: 'userAction() execute is callable', value: null })
	.expect.output(calledIsTrue)
	.assert();
