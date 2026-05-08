'use strict';

const { runner } = require('@trysquare/core');

require('./lib/equality.test');
require('./lib/structure.test');
require('./lib/type.test');
require('./lib/pattern.test');
require('./lib/spy.test');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
