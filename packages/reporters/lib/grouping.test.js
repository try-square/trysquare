'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { groupTests } = require('./grouping');

function makeTest(component, baseId) {
	return { component, _baseId: baseId, inputs: [], stubs: null, lifecycleState: null, userActions: [], type: 'behavioral', specs: [], sideEffects: [], result: 'pass', specResults: [] };
}

function groupTestsBehavior(_) {
	const single    = groupTests([makeTest('Foo', 'b1')]);
	const sameBase  = groupTests([makeTest('Foo', 'b1'), makeTest('Foo', 'b1')]);
	const diffBase  = groupTests([makeTest('Foo', 'b1'), makeTest('Foo', 'b2')]);
	const twoComps  = groupTests([makeTest('Alpha', 'b1'), makeTest('Beta', 'b2'), makeTest('Alpha', 'b1')]);

	return {
		singleLength:        single.length,
		singleComponent:     single[0].component,
		singleBaseGroups:    single[0].baseGroups.length,
		singleTests:         single[0].baseGroups[0].tests.length,
		sameBaseGroups:      sameBase[0].baseGroups.length,
		sameBaseTests:       sameBase[0].baseGroups[0].tests.length,
		diffBaseGroups:      diffBase[0].baseGroups.length,
		twoCompsLength:      twoComps.length,
		twoCompsFirst:       twoComps[0].component,
		twoCompsSecond:      twoComps[1].component,
		twoCompsAlphaTests:  twoComps[0].baseGroups[0].tests.length,
	};
}

function groupTestsBehaviorCorrect(r) {
	assert.strictEqual(r.singleLength,       1);
	assert.strictEqual(r.singleComponent,    'Foo');
	assert.strictEqual(r.singleBaseGroups,   1);
	assert.strictEqual(r.singleTests,        1);
	assert.strictEqual(r.sameBaseGroups,     1);
	assert.strictEqual(r.sameBaseTests,      2);
	assert.strictEqual(r.diffBaseGroups,     2);
	assert.strictEqual(r.twoCompsLength,     2);
	assert.strictEqual(r.twoCompsFirst,      'Alpha');
	assert.strictEqual(r.twoCompsSecond,     'Beta');
	assert.strictEqual(r.twoCompsAlphaTests, 2);
}

when(groupTestsBehavior)
	.hasInputs({ name: 'groupTests() basic behavior', value: null })
	.expect.output(groupTestsBehaviorCorrect)
	.assert();

function groupTestsNullBaseId(_) {
	const nullBase = groupTests([makeTest('Foo', null), makeTest('Foo', null)]);
	const mixed    = groupTests([makeTest('Foo', 'b1'), makeTest('Foo', null), makeTest('Foo', 'b1')]);

	return {
		nullBaseGroups:    nullBase[0].baseGroups.length,
		nullBaseGroup0:    nullBase[0].baseGroups[0].tests.length,
		nullBaseGroup1:    nullBase[0].baseGroups[1].tests.length,
		mixedBaseGroups:   mixed[0].baseGroups.length,
		mixedGroup0Tests:  mixed[0].baseGroups[0].tests.length,
		mixedGroup1Tests:  mixed[0].baseGroups[1].tests.length,
	};
}

function groupTestsNullBaseIdCorrect(r) {
	assert.strictEqual(r.nullBaseGroups,   2);
	assert.strictEqual(r.nullBaseGroup0,   1);
	assert.strictEqual(r.nullBaseGroup1,   1);
	assert.strictEqual(r.mixedBaseGroups,  2);
	assert.strictEqual(r.mixedGroup0Tests, 2);
	assert.strictEqual(r.mixedGroup1Tests, 1);
}

when(groupTestsNullBaseId)
	.hasInputs({ name: 'groupTests() null baseId behavior', value: null })
	.expect.output(groupTestsNullBaseIdCorrect)
	.assert();
