'use strict';

// DOM environment must be set up before React or @testing-library/react are required.
require('./setup-dom');

const React                          = require('react');
const { runner }                     = require('@trysquare/core');
const { setupReactRunner }           = require('@trysquare/react');
const { render }                     = require('@testing-library/react');

// Pass react and renderFn from this project's node_modules so that createElement
// and render share the same React instance — avoiding the dual-instance element mismatch.
setupReactRunner(runner, { react: React, renderFn: render });

require('./lib/login-form.test');
require('./lib/product-card.test');

runner.run().then(suite => {
	const status = `${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`;
	process.stdout.write(status + '\n');
	process.exit(suite.failed > 0 ? 1 : 0);
});
