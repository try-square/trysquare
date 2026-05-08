'use strict';

const { runner } = require('@trysquare/core');

require('./lib/grouping.test');
require('./lib/markdown-reporter.test');
require('./lib/html-reporter.test');
require('./lib/junit-reporter.test');
require('./lib/pdf-reporter.test');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
