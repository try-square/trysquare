'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { action } = require('./action');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function actionBehavior(_) {
	const execute = async () => {};
	const result  = action('clicks submit', execute);
	let called = false;
	const callable = action('fires', () => { called = true; });
	callable.execute();
	return {
		emptyName:   catching(() => action('', () => {})),
		nullName:    catching(() => action(null, () => {})),
		nullExec:    catching(() => action('click button', null)),
		noExec:      catching(() => action('click button')),
		stringExec:  catching(() => action('click button', 'string')),
		name:        result.name,
		execute:     result.execute === execute,
		contractOk:  typeof result.name === 'string' && result.name.length > 0,
		execCalled:  called,
	};
}

function actionBehaviorCorrect(r) {
	assert.match(r.emptyName.message,  /non-empty string name/);
	assert.match(r.nullName.message,   /non-empty string name/);
	assert.match(r.nullExec.message,   /execute function/);
	assert.match(r.noExec.message,     /execute function/);
	assert.match(r.stringExec.message, /execute function/);
	assert.strictEqual(r.name,        'clicks submit');
	assert.strictEqual(r.execute,     true);
	assert.strictEqual(r.contractOk,  true);
	assert.strictEqual(r.execCalled,  true);
}

when(actionBehavior)
	.hasInputs({ name: 'action() behavior', value: null })
	.expect.output(actionBehaviorCorrect)
	.assert();

async function asyncActionBehavior(_) {
	const order = [];
	const result = action('async step', async () => { order.push('done'); });
	await result.execute();
	return order;
}

function asyncActionRan(order) {
	assert.deepStrictEqual(order, ['done']);
}

when(asyncActionBehavior)
	.hasInputs({ name: 'action() async execute', value: null })
	.expect.output(asyncActionRan)
	.assert();
