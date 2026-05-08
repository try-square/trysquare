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
		hasMounting:   !!states.mounting,
		hasMounted:    !!states.mounted,
		hasUpdating:   !!states.updating,
		hasUnmounted:  !!states.unmounted,
		mountingName:  states.mounting.name,
		mountedName:   states.mounted.name,
		updatingName:  states.updating.name,
		unmountedName: states.unmounted.name,
		frozenThrow:   catching(() => { states.mounted.name = 'changed'; }),
	};
}

function statesStructureCorrect(r) {
	assert.strictEqual(r.hasMounting,   true);
	assert.strictEqual(r.hasMounted,    true);
	assert.strictEqual(r.hasUpdating,   true);
	assert.strictEqual(r.hasUnmounted,  true);
	assert.strictEqual(r.mountingName,  'mounting');
	assert.strictEqual(r.mountedName,   'mounted');
	assert.strictEqual(r.updatingName,  'updating');
	assert.strictEqual(r.unmountedName, 'unmounted');
	assert.ok(r.frozenThrow instanceof TypeError);
}

when(statesStructure)
	.hasInputs({ name: 'states structure', value: null })
	.expect.output(statesStructureCorrect)
	.assert();
