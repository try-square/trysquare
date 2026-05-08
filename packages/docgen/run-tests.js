'use strict';

const runner = require('./lib/document-generator.test');

runner.run().then(function onDone(suite) {
	console.log(`${suite.passed} passed, ${suite.failed} failed`);
	if (suite.failed > 0) process.exit(1);
}).catch(function onError(err) {
	console.error(err);
	process.exit(1);
});
