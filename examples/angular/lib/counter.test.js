'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { mount, withInputs, userAction } = require('@trysquare/angular');
const { spy, wasCalledWith, wasCalledOnce } = require('@trysquare/matchers');
const { CounterComponent } = require('./counter');

// ── Default state ─────────────────────────────────────────────────────────────

function startsAtZero(fixture) {
	assert.strictEqual(fixture.componentInstance.count, 0);
}

function hasDefaultStep(fixture) {
	assert.strictEqual(fixture.componentInstance.step, 1);
}

when(mount(CounterComponent))
	.hasInputs(withInputs('default inputs', {}))
	.expect.output(startsAtZero, hasDefaultStep)
	.assert();

// ── Custom step input ─────────────────────────────────────────────────────────

function showsCustomStep(fixture) {
	assert.strictEqual(fixture.componentInstance.step, 5);
}

when(mount(CounterComponent))
	.hasInputs(withInputs('step of 5', { step: 5 }))
	.expect.output(showsCustomStep)
	.assert();

// ── Increment by step ─────────────────────────────────────────────────────────

const clicksIncrement = userAction('clicks increment button', async (fixture) => {
	fixture.componentInstance.increment();
});

function countIncreasedByStep(fixture) {
	assert.strictEqual(fixture.componentInstance.count, 5);
}

when(mount(CounterComponent))
	.hasInputs(withInputs('step of 5', { step: 5 }))
	.andUser(clicksIncrement)
	.expect.behaviors(countIncreasedByStep)
	.assert();

// ── Decrement goes negative ───────────────────────────────────────────────────

const clicksDecrement = userAction('clicks decrement button', async (fixture) => {
	fixture.componentInstance.decrement();
});

function countIsNegative(fixture) {
	assert.ok(fixture.componentInstance.count < 0, 'count should be negative after decrement');
}

when(mount(CounterComponent))
	.hasInputs(withInputs('default step', {}))
	.andUser(clicksDecrement)
	.expect.behaviors(countIsNegative)
	.assert();

// ── Count change event ────────────────────────────────────────────────────────

const mockCountChange = spy('count change handler');

function emitsNewCount(fixture) {
	wasCalledWith(mockCountChange, [5]).assert(fixture);
}

function handlerCalledOnce(fixture) {
	wasCalledOnce(mockCountChange).assert(fixture);
}

when(mount(CounterComponent))
	.hasInputs(withInputs('step of 5 with handler', { step: 5, onCountChange: mockCountChange }))
	.andUser(clicksIncrement)
	.expect.behaviors(emitsNewCount, handlerCalledOnce)
	.assert();

// ── Reset clears count ────────────────────────────────────────────────────────

const incrementThenReset = userAction('increments then resets', async (fixture) => {
	fixture.componentInstance.increment();
	fixture.componentInstance.increment();
	fixture.componentInstance.reset();
});

function countIsZeroAfterReset(fixture) {
	assert.strictEqual(fixture.componentInstance.count, 0);
}

when(mount(CounterComponent))
	.hasInputs(withInputs('step of 10', { step: 10 }))
	.andUser(incrementThenReset)
	.expect.behaviors(countIsZeroAfterReset)
	.assert();
