'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { sequence } = require('./sequence');

function sequenceBehavior(_) {
	const defSeq    = sequence();
	const customStart = sequence(100);
	const customStep  = sequence(0, 10);
	const indA = sequence();
	const indB = sequence();
	indA(); indA();
	const negStep = sequence(0, -5);
	const zeroStep = sequence(5, 0);
	return {
		defaultFirst:    defSeq(),
		defaultSecond:   defSeq(),
		defaultThird:    defSeq(),
		customStart100:  customStart(),
		customStart101:  customStart(),
		customStep0:     customStep(),
		customStep10:    customStep(),
		customStep20:    customStep(),
		indAThird:       indA(),
		indBFirst:       indB(),
		negStepFallback1:negStep(),
		negStepFallback2:negStep(),
		zeroStepFallback1:zeroStep(),
		zeroStepFallback2:zeroStep(),
	};
}

function sequenceBehaviorCorrect(r) {
	assert.strictEqual(r.defaultFirst,   1);
	assert.strictEqual(r.defaultSecond,  2);
	assert.strictEqual(r.defaultThird,   3);
	assert.strictEqual(r.customStart100, 100);
	assert.strictEqual(r.customStart101, 101);
	assert.strictEqual(r.customStep0,    0);
	assert.strictEqual(r.customStep10,   10);
	assert.strictEqual(r.customStep20,   20);
	assert.strictEqual(r.indAThird,      3);
	assert.strictEqual(r.indBFirst,      1);
	assert.strictEqual(r.negStepFallback1, 0);
	assert.strictEqual(r.negStepFallback2, 1);
	assert.strictEqual(r.zeroStepFallback1, 5);
	assert.strictEqual(r.zeroStepFallback2, 6);
}

when(sequenceBehavior)
	.hasInputs({ name: 'sequence() behavior', value: null })
	.expect.output(sequenceBehaviorCorrect)
	.assert();
