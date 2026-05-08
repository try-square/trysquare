'use strict';

require('./lib/validator.test');
require('./lib/form.test');

const { runner } = require('@trysquare/core');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
