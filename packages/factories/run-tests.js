'use strict';

const { runner } = require('@trysquare/core');

require('./lib/input.test');
require('./lib/stub.test');
require('./lib/action.test');
require('./lib/factory.test');
require('./lib/sequence.test');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
