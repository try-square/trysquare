'use strict';

require('./lib/tax.test');
require('./lib/currency.test');
require('./lib/discount.test');
require('./lib/payment.test');

const { runner } = require('@trysquare/core');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
