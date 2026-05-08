'use strict';

function processPayment({ amount, card, gateway, logger, recorder }) {
	logger(`Processing payment of $${amount}`);
	const result = gateway(card, amount);
	recorder(result);
	if (!result.success) {
		logger(`Payment failed: ${result.error}`);
	}
	return result;
}

module.exports = { processPayment };
