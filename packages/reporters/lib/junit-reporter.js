'use strict';

const fs = require('fs');
const path = require('path');
const { groupTests } = require('./grouping');
const { givenLabel, whenLabel } = require('./label');

class JUnitReporter {
	constructor(options) {
		this._output = (options && options.output) ? options.output : './test-results/junit.xml';
	}

	onSuiteStart(suite) {}
	onTestStart(test) {}
	onTestPass(test) {}
	onTestFail(test) {}
	onTestSkip(test) {}

	onSuiteEnd(suite) {
		const content = buildJUnit(suite);
		const outputPath = path.resolve(this._output);
		fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		fs.writeFileSync(outputPath, content, 'utf8');
	}
}

function buildJUnit(suite) {
	const totalTests = suite.tests.length;
	const totalFailed = suite.failed || 0;
	const totalSkipped = suite.skipped || 0;
	const totalTime = ((suite.duration || 0) / 1000).toFixed(3);

	const components = groupTests(suite.tests);

	const testsuites = components.map(comp => buildTestsuite(comp)).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="trysquare" tests="${totalTests}" failures="${totalFailed}" errors="0" skipped="${totalSkipped}" time="${totalTime}">
${testsuites}
</testsuites>
`;
}

function buildTestsuite(comp) {
	const allTests = comp.baseGroups.flatMap(g => g.tests);
	const failed = allTests.filter(t => t.result === 'fail').length;
	const skipped = allTests.filter(t => t.result === 'skip').length;
	const duration = allTests.reduce((sum, t) => sum + (t.duration || 0), 0);
	const time = (duration / 1000).toFixed(3);

	const cases = allTests.map(test => buildTestcase(test, comp.component)).join('\n');

	return `\t<testsuite name="${esc(comp.component)}" tests="${allTests.length}" failures="${failed}" errors="0" skipped="${skipped}" time="${time}">
${cases}
\t</testsuite>`;
}

function buildTestcase(test, component) {
	const name = buildTestcaseName(test);
	const time = ((test.duration || 0) / 1000).toFixed(3);
	const attrs = `name="${esc(name)}" classname="${esc(component)}" time="${time}"`;

	if (test.result === 'skip') {
		return `\t\t<testcase ${attrs}>\n\t\t\t<skipped/>\n\t\t</testcase>`;
	}

	if (test.result === 'pass') {
		return `\t\t<testcase ${attrs}/>`;
	}

	// Failed test — find the first failing spec result or use the top-level error
	const failedSpec = test.specResults && test.specResults.find(sr => sr.result === 'fail');
	const error = (failedSpec && failedSpec.error) || test.error;
	const message = error ? error.message : 'Test failed';
	const type = (error && error.constructor && error.constructor.name) || 'Error';
	const stack = error && error.stack ? esc(error.stack) : esc(message);
	const specName = failedSpec ? esc(failedSpec.name) : '';
	const failureMessage = specName ? `${esc(message)} (spec: ${specName})` : esc(message);

	return `\t\t<testcase ${attrs}>
\t\t\t<failure message="${failureMessage}" type="${esc(type)}">${stack}</failure>
\t\t</testcase>`;
}

function buildTestcaseName(test) {
	const parts = [];
	const given = givenLabel(test);
	const when = whenLabel(test);
	if (given) parts.push(given);
	if (when) parts.push(when);
	return parts.length > 0 ? parts.join(' / ') : test.type || 'test';
}

function esc(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

module.exports = { JUnitReporter, buildJUnit };
