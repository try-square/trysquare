'use strict';

function formatCurrency({ amount, symbol }) {
	return `${symbol}${amount.toFixed(2)}`;
}

function convertCurrency({ amount, fromRate, toRate }) {
	return Math.round((amount / fromRate) * toRate * 100) / 100;
}

function roundToNearestCent({ amount }) {
	return Math.round(amount * 100) / 100;
}

function splitAmount({ total, ways }) {
	const share = Math.floor(total * 100 / ways) / 100;
	const remainder = Math.round((total - share * ways) * 100) / 100;
	return { share, remainder };
}

module.exports = { formatCurrency, convertCurrency, roundToNearestCent, splitAmount };
