'use strict';

class Reporter {
	onSuiteStart(suite) {}
	onTestStart(test) {}
	onTestPass(test) {}
	onTestFail(test) {}
	onTestSkip(test) {}
	onSuiteEnd(suite) {}
}

class ConsoleReporter extends Reporter {
	onSuiteStart(suite) {
		const count = suite.tests.length;
		console.log(`\nRunning ${count} test${count === 1 ? '' : 's'}\n`);
	}

	onTestPass(test) {
		console.log(`  ✓ ${buildTestLabel(test)}`);
	}

	onTestFail(test) {
		console.log(`  ✗ ${buildTestLabel(test)}`);
		if (test.specResults) {
			for (const sr of test.specResults) {
				if (sr.result === 'fail') {
					console.log(`      ✗ ${sr.name}`);
					if (sr.error && sr.error.message) {
						console.log(`        ${sr.error.message}`);
					}
				}
			}
		}
	}

	onTestSkip(test) {
		console.log(`  - ${buildTestLabel(test)} (skipped)`);
	}

	onSuiteEnd(suite) {
		const parts = [];
		if (suite.passed) parts.push(`${suite.passed} passed`);
		if (suite.failed) parts.push(`${suite.failed} failed`);
		if (suite.skipped) parts.push(`${suite.skipped} skipped`);
		const duration = suite.duration != null ? ` (${suite.duration}ms)` : '';
		console.log(`\n${parts.join(', ')}${duration}\n`);
		if (suite.failed > 0) {
			process.exitCode = 1;
		}
	}
}

function buildTestLabel(test) {
	const parts = [test.component];
	if (test.lifecycleState) parts.push(`in ${test.lifecycleState.name}`);
	if (test.inputs && test.inputs.length > 0) {
		parts.push(`given: ${test.inputs.map(i => i.name).join(' → ')}`);
	}
	if (test.stubs) parts.push(`when: ${test.stubs.name}`);
	if (test.userActions && test.userActions.length > 0) {
		parts.push(`user: ${test.userActions.map(a => a.name).join(', then ')}`);
	}
	return parts.join(' / ');
}

module.exports = { Reporter, ConsoleReporter };
