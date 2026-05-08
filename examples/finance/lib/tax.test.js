'use strict';

const { when } = require('@trysquare/core');
const { equals } = require('@trysquare/matchers');
const { input, factory } = require('@trysquare/factories');
const { calculateTax, effectiveRate, marginalBracket } = require('./tax');

const makeIncome = factory({ deductions: 0 });

const usBrackets = [
	{ threshold: 0,      rate: 0.10 },
	{ threshold: 11000,  rate: 0.12 },
	{ threshold: 44725,  rate: 0.22 },
	{ threshold: 95375,  rate: 0.24 },
	{ threshold: 182050, rate: 0.32 },
];

// ── calculateTax ──────────────────────────────────────────────────────────────

when(calculateTax)
	.hasInputs(makeIncome('standard bracket', { income: 50000, rate: 0.2 }))
	.expect.output(equals(10000))
	.assert();

when(calculateTax)
	.hasInputs(makeIncome('with deductions', { income: 50000, rate: 0.2, deductions: 10000 }))
	.expect.output(equals(8000))
	.assert();

when(calculateTax)
	.hasInputs(makeIncome('zero income', { income: 0, rate: 0.2 }))
	.expect.output(equals(0))
	.assert();

when(calculateTax)
	.hasInputs(makeIncome('deductions exceed income', { income: 5000, rate: 0.2, deductions: 10000 }))
	.expect.output(equals(0))
	.assert();

when(calculateTax)
	.hasInputs(makeIncome('fractional result', { income: 33333, rate: 0.3 }))
	.expect.output(equals(9999.9))
	.assert();

// ── effectiveRate ─────────────────────────────────────────────────────────────

when(effectiveRate)
	.hasInputs(input('10% effective rate', { grossIncome: 100000, taxPaid: 10000 }))
	.expect.output(equals(0.1))
	.assert();

when(effectiveRate)
	.hasInputs(input('22.5% effective rate', { grossIncome: 80000, taxPaid: 18000 }))
	.expect.output(equals(0.225))
	.assert();

when(effectiveRate)
	.hasInputs(input('zero income guard', { grossIncome: 0, taxPaid: 0 }))
	.expect.output(equals(0))
	.assert();

// ── marginalBracket ───────────────────────────────────────────────────────────

when(marginalBracket)
	.hasInputs(input('income in 10% bracket', { income: 9000, brackets: usBrackets }))
	.expect.output(equals(0.10))
	.assert();

when(marginalBracket)
	.hasInputs(input('income in 22% bracket', { income: 60000, brackets: usBrackets }))
	.expect.output(equals(0.22))
	.assert();

when(marginalBracket)
	.hasInputs(input('income at exact bracket boundary', { income: 44725, brackets: usBrackets }))
	.expect.output(equals(0.22))
	.assert();
