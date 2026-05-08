'use strict';

const { runner } = require('./index');

require('./lib/validate.test');
require('./lib/scenario.test');
require('./lib/runner.test');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
