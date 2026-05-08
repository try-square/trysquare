'use strict';

const { when } = require('@trysquare/core');
const { equals } = require('@trysquare/matchers');
const { input } = require('@trysquare/factories');
const { applyDiscount, stackDiscounts } = require('./discount');

const tenPercentOff  = { name: '10% discount rule',  type: 'percent', value: 10  };
const twentyPercentOff = { name: '20% discount rule', type: 'percent', value: 20  };
const fiveDollarsOff = { name: '$5 discount rule',   type: 'fixed',   value: 5   };

const hundredDollarCart = { name: '$100 cart', total: 100 };
const fourDollarCart    = { name: '$4 cart',   total: 4   };

// Named selector — extracts just the total for clean assertions
function total(result) { return result.total; }

// ── applyDiscount (curried via .andInputs) ────────────────────────────────────

when(applyDiscount, 'percent discount reduces total')
	.hasInputs(tenPercentOff)
	.andInputs(hundredDollarCart)
	.expect.output(equals(90, total))
	.assert();

when(applyDiscount, 'fixed discount reduces total')
	.hasInputs(fiveDollarsOff)
	.andInputs(hundredDollarCart)
	.expect.output(equals(95, total))
	.assert();

when(applyDiscount, 'fixed discount cannot go below zero')
	.hasInputs(fiveDollarsOff)
	.andInputs(fourDollarCart)
	.expect.output(equals(0, total))
	.assert();

when(applyDiscount, '20% off $100')
	.hasInputs(twentyPercentOff)
	.andInputs(hundredDollarCart)
	.expect.output(equals(80, total))
	.assert();

// ── stackDiscounts (curried via .andInputs) ───────────────────────────────────

// 10% off $100 = $90, then $5 off $90 = $85
when(stackDiscounts, 'percent then fixed')
	.hasInputs(input('stacked: 10% then $5 off', { rules: [tenPercentOff, fiveDollarsOff] }))
	.andInputs(hundredDollarCart)
	.expect.output(equals(85, total))
	.assert();

// $5 off $100 = $95, then 10% off $95 = $85.50
when(stackDiscounts, 'fixed then percent')
	.hasInputs(input('stacked: $5 then 10% off', { rules: [fiveDollarsOff, tenPercentOff] }))
	.andInputs(hundredDollarCart)
	.expect.output(equals(85.5, total))
	.assert();

when(stackDiscounts, 'empty rule set is identity')
	.hasInputs(input('no discounts', { rules: [] }))
	.andInputs(hundredDollarCart)
	.expect.output(equals(100, total))
	.assert();
