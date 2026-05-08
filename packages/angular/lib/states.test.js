'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { states } = require('./states');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function statesStructure(_) {
	return {
		hasCreated:      !!states.created,
		hasNgOnInit:     !!states.ngOnInit,
		hasNgOnChanges:  !!states.ngOnChanges,
		hasNgOnDestroy:  !!states.ngOnDestroy,
		createdName:     states.created.name,
		ngOnInitName:    states.ngOnInit.name,
		ngOnChangesName: states.ngOnChanges.name,
		ngOnDestroyName: states.ngOnDestroy.name,
		frozenInit:      catching(() => { states.ngOnInit.name = 'changed'; }),
		frozenCreated:   catching(() => { states.created.name  = 'changed'; }),
	};
}

function statesStructureCorrect(r) {
	assert.strictEqual(r.hasCreated,      true);
	assert.strictEqual(r.hasNgOnInit,     true);
	assert.strictEqual(r.hasNgOnChanges,  true);
	assert.strictEqual(r.hasNgOnDestroy,  true);
	assert.strictEqual(r.createdName,     'created');
	assert.strictEqual(r.ngOnInitName,    'ngOnInit');
	assert.strictEqual(r.ngOnChangesName, 'ngOnChanges');
	assert.strictEqual(r.ngOnDestroyName, 'ngOnDestroy');
	assert.ok(r.frozenInit    instanceof TypeError);
	assert.ok(r.frozenCreated instanceof TypeError);
}

when(statesStructure)
	.hasInputs({ name: 'states structure', value: null })
	.expect.output(statesStructureCorrect)
	.assert();
