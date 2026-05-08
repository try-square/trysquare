'use strict';

function calculateTax({ income, rate, deductions }) {
	const taxable = Math.max(0, income - (deductions || 0));
	return Math.round(taxable * rate * 100) / 100;
}

function effectiveRate({ grossIncome, taxPaid }) {
	if (grossIncome <= 0) return 0;
	return Math.round((taxPaid / grossIncome) * 10000) / 10000;
}

function marginalBracket({ income, brackets }) {
	for (let i = brackets.length - 1; i >= 0; i--) {
		if (income >= brackets[i].threshold) return brackets[i].rate;
	}
	return 0;
}

module.exports = { calculateTax, effectiveRate, marginalBracket };
