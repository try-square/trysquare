'use strict';

const { runner } = require('@trysquare/core');

require('./lib/mount.test');
require('./lib/states.test');
require('./lib/helpers.test');
require('./lib/user-action.test');
require('./lib/mocks.test');
require('./lib/react-runner.test');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
