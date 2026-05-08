'use strict';

function applyDiscount(rule) {
	return function applyToCart(cart) {
		const total = rule.type === 'percent'
			? Math.round(cart.total * (1 - rule.value / 100) * 100) / 100
			: Math.max(0, Math.round((cart.total - rule.value) * 100) / 100);
		return { ...cart, total };
	};
}

function stackDiscounts({ rules }) {
	return function applyAll(cart) {
		return rules.reduce((c, rule) => applyDiscount(rule)(c), cart);
	};
}

module.exports = { applyDiscount, stackDiscounts };
