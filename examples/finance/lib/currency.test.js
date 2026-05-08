'use strict';

const { when } = require('@trysquare/core');
const { equals, deepEquals, matches } = require('@trysquare/matchers');
const { input } = require('@trysquare/factories');
const { formatCurrency, convertCurrency, roundToNearestCent, splitAmount } = require('./currency');

// ── formatCurrency ────────────────────────────────────────────────────────────

when(formatCurrency)
	.hasInputs(input('USD amount', { amount: 1234.5, symbol: '$' }))
	.expect.output(equals('$1234.50'))
	.assert();

when(formatCurrency)
	.hasInputs(input('GBP whole number', { amount: 99, symbol: '£' }))
	.expect.output(equals('£99.00'))
	.assert();

when(formatCurrency)
	.hasInputs(input('EUR format matches pattern', { amount: 50.5, symbol: '€' }))
	.expect.output(matches(/^€\d+\.\d{2}$/))
	.assert();

// ── convertCurrency ───────────────────────────────────────────────────────────

when(convertCurrency)
	.hasInputs(input('USD to EUR', { amount: 100, fromRate: 1, toRate: 0.92 }))
	.expect.output(equals(92))
	.assert();

when(convertCurrency)
	.hasInputs(input('EUR back to USD', { amount: 92, fromRate: 0.92, toRate: 1 }))
	.expect.output(equals(100))
	.assert();

when(convertCurrency)
	.hasInputs(input('GBP to JPY', { amount: 1, fromRate: 0.79, toRate: 149.5 }))
	.expect.output(equals(189.24))
	.assert();

// ── roundToNearestCent ────────────────────────────────────────────────────────

when(roundToNearestCent)
	.hasInputs(input('rounds up', { amount: 1.555 }))
	.expect.output(equals(1.56))
	.assert();

when(roundToNearestCent)
	.hasInputs(input('truncates sub-cent', { amount: 1.554 }))
	.expect.output(equals(1.55))
	.assert();

when(roundToNearestCent)
	.hasInputs(input('already exact', { amount: 9.99 }))
	.expect.output(equals(9.99))
	.assert();

// ── splitAmount ───────────────────────────────────────────────────────────────

function share(r) { return r.share; }
function remainder(r) { return r.remainder; }

when(splitAmount)
	.hasInputs(input('$10 split 3 ways', { total: 10, ways: 3 }))
	.expect.output(
		equals(3.33, share),
		equals(0.01, remainder)
	)
	.assert();

when(splitAmount)
	.hasInputs(input('$9 split 3 ways — no remainder', { total: 9, ways: 3 }))
	.expect.output(
		equals(3, share),
		equals(0, remainder)
	)
	.assert();
