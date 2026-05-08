'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { buildIndexHTML, buildComponentHTML, HTMLReporter } = require('./html-reporter');
const { groupTests } = require('./grouping');

function makeTest(overrides) {
	return Object.assign({
		component: 'UserForm',
		_baseId: 'b1',
		inputs: [{ name: 'valid input' }],
		stubs: { name: 'happy path' },
		lifecycleState: null,
		userActions: [],
		type: 'output',
		specs: [{ name: 'submits successfully' }],
		sideEffects: [],
		result: 'pass',
		duration: 30,
		error: null,
		ignored: false,
		specResults: [{ name: 'submits successfully', category: 'spec', result: 'pass' }],
	}, overrides);
}

function makeSummary(overrides) {
	return Object.assign({ component: 'UserForm', slug: 'userform', passed: 1, failed: 0, skipped: 0 }, overrides);
}

function makeSuite(tests) {
	return { tests, passed: tests.filter(t => t.result === 'pass').length, failed: tests.filter(t => t.result === 'fail').length, skipped: tests.filter(t => t.result === 'skip').length, duration: 100 };
}

function withTempDir(fn) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trysquare-html-'));
	try { return fn(dir); }
	finally { fs.rmSync(dir, { recursive: true }); }
}

function htmlBuildBehavior(_) {
	const comp = groupTests([makeTest()])[0];

	const indexHtml      = buildIndexHTML([makeSummary()], makeSuite([makeTest()]));
	const indexCounts    = buildIndexHTML([makeSummary({ passed: 3, failed: 1 })], makeSuite([makeTest()]));
	const compHtml       = buildComponentHTML(comp, makeSummary());

	const failTest = makeTest({
		result: 'fail',
		specResults: [{ name: 'submits successfully', category: 'spec', result: 'fail', error: new Error('nope') }],
	});
	const failComp = groupTests([failTest])[0];
	const failHtml = buildComponentHTML(failComp, makeSummary({ failed: 1, passed: 0 }));

	const xssTest = makeTest({ component: '<Script>Alert' });
	const xssComp = groupTests([xssTest])[0];
	const xssHtml = buildComponentHTML(xssComp, makeSummary({ component: '<Script>Alert', slug: 'scriptalert' }));

	return {
		doctype:          indexHtml.startsWith('<!DOCTYPE html>'),
		indexHasLink:     indexHtml.includes('UserForm') && indexHtml.includes('href="userform.html"'),
		indexCounts:      indexCounts.includes('1 passed') && indexCounts.includes('0 failed'),
		compH1:           compHtml.includes('<h1>UserForm</h1>'),
		compGiven:        compHtml.includes('Given: valid input'),
		compWhen:         compHtml.includes('When: happy path'),
		compSpec:         compHtml.includes('submits successfully'),
		failClass:        failHtml.includes('class="test fail"'),
		xssEscaped:       !xssHtml.includes('<Script>Alert') && xssHtml.includes('&lt;Script&gt;Alert'),
		backLink:         compHtml.includes('href="index.html"'),
	};
}

function htmlBuildBehaviorCorrect(r) {
	assert.strictEqual(r.doctype,       true);
	assert.strictEqual(r.indexHasLink,  true);
	assert.strictEqual(r.indexCounts,   true);
	assert.strictEqual(r.compH1,        true);
	assert.strictEqual(r.compGiven,     true);
	assert.strictEqual(r.compWhen,      true);
	assert.strictEqual(r.compSpec,      true);
	assert.strictEqual(r.failClass,     true);
	assert.strictEqual(r.xssEscaped,    true);
	assert.strictEqual(r.backLink,      true);
}

when(htmlBuildBehavior)
	.hasInputs({ name: 'buildIndexHTML() and buildComponentHTML() behavior', value: null })
	.expect.output(htmlBuildBehaviorCorrect)
	.assert();

function htmlReporterBehavior(_) {
	const defaultOutput = new HTMLReporter()._output;

	const writesIndex = withTempDir(dir => {
		new HTMLReporter({ output: dir }).onSuiteEnd(makeSuite([makeTest()]));
		return fs.existsSync(path.join(dir, 'index.html'));
	});

	const writesComponent = withTempDir(dir => {
		new HTMLReporter({ output: dir }).onSuiteEnd(makeSuite([makeTest({ component: 'UserForm' })]));
		return fs.existsSync(path.join(dir, 'userform.html'));
	});

	const indexHasLink = withTempDir(dir => {
		new HTMLReporter({ output: dir }).onSuiteEnd(makeSuite([makeTest({ component: 'UserForm' })]));
		const content = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
		return content.includes('UserForm') && content.includes('href="userform.html"');
	});

	const compHasSpec = withTempDir(dir => {
		new HTMLReporter({ output: dir }).onSuiteEnd(makeSuite([makeTest()]));
		return fs.readFileSync(path.join(dir, 'userform.html'), 'utf8').includes('submits successfully');
	});

	const createsNestedDirs = withTempDir(base => {
		const dir = path.join(base, 'new', 'nested');
		new HTMLReporter({ output: dir }).onSuiteEnd(makeSuite([makeTest()]));
		return fs.existsSync(path.join(dir, 'index.html'));
	});

	const writesMultiple = withTempDir(dir => {
		new HTMLReporter({ output: dir }).onSuiteEnd(makeSuite([
			makeTest({ component: 'LoginForm',  _baseId: 'a1' }),
			makeTest({ component: 'SignupForm', _baseId: 'b1' }),
		]));
		return fs.existsSync(path.join(dir, 'loginform.html')) && fs.existsSync(path.join(dir, 'signupform.html'));
	});

	return { defaultOutput, writesIndex, writesComponent, indexHasLink, compHasSpec, createsNestedDirs, writesMultiple };
}

function htmlReporterBehaviorCorrect(r) {
	assert.strictEqual(r.defaultOutput,    './spec-docs');
	assert.strictEqual(r.writesIndex,      true);
	assert.strictEqual(r.writesComponent,  true);
	assert.strictEqual(r.indexHasLink,     true);
	assert.strictEqual(r.compHasSpec,      true);
	assert.strictEqual(r.createsNestedDirs, true);
	assert.strictEqual(r.writesMultiple,   true);
}

when(htmlReporterBehavior)
	.hasInputs({ name: 'HTMLReporter file-writing behavior', value: null })
	.expect.output(htmlReporterBehaviorCorrect)
	.assert();
