'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { buildJUnit, JUnitReporter } = require('./junit-reporter');

function makeTest(overrides) {
	return Object.assign({
		component: 'LoginForm',
		_baseId: 'b1',
		inputs: [{ name: 'valid credentials' }],
		stubs: { name: 'happy path API' },
		lifecycleState: null,
		userActions: [],
		type: 'output',
		specs: [{ name: 'authenticates user' }],
		sideEffects: [],
		result: 'pass',
		duration: 42,
		error: null,
		specResults: [{ name: 'authenticates user', category: 'spec', result: 'pass' }],
	}, overrides);
}

function makeSuite(tests, overrides) {
	return Object.assign({ tests, passed: tests.filter(t => t.result === 'pass').length, failed: tests.filter(t => t.result === 'fail').length, skipped: tests.filter(t => t.result === 'skip').length, duration: 120 }, overrides);
}

function withTempDir(fn) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trysquare-junit-'));
	try { return fn(dir); }
	finally { fs.rmSync(dir, { recursive: true }); }
}

function buildJUnitBehavior(_) {
	const basic = buildJUnit(makeSuite([makeTest()]));

	const failTest = makeTest({
		result: 'fail',
		specResults: [{ name: 'authenticates user', category: 'spec', result: 'fail', error: new Error('wrong user') }],
	});
	const failing = buildJUnit(makeSuite([failTest]));

	const skipped = buildJUnit(makeSuite([makeTest({ result: 'skip', specResults: [] })]));

	const xssXml = buildJUnit(makeSuite([makeTest({
		component: 'Form<Input>',
		stubs: { name: 'stub with "quotes"' },
	})]));

	const counts = buildJUnit(makeSuite([
		makeTest({ result: 'pass' }),
		makeTest({ result: 'fail', specResults: [] }),
		makeTest({ result: 'skip', specResults: [] }),
	]));

	const twoComps = buildJUnit(makeSuite([
		makeTest({ component: 'LoginForm', _baseId: 'a1' }),
		makeTest({ component: 'Dashboard', _baseId: 'b1' }),
	]));

	return {
		xmlDecl:        basic.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),
		hasSuites:      basic.includes('<testsuites') && basic.includes('</testsuites>'),
		suiteName:      basic.includes('name="LoginForm"'),
		noFailure:      !basic.includes('<failure'),
		hasFailure:     failing.includes('<failure') && failing.includes('wrong user'),
		hasSkipped:     skipped.includes('<skipped'),
		givenWhen:      basic.includes('Given: valid credentials') && basic.includes('When: happy path API'),
		xssEscaped:     xssXml.includes('Form&lt;Input&gt;') && xssXml.includes('stub with &quot;quotes&quot;'),
		countsTests:    counts.includes('tests="3"') && counts.includes('failures="1"') && counts.includes('skipped="1"'),
		twoSuites:      (twoComps.match(/<testsuite /g) || []).length === 2,
	};
}

function buildJUnitBehaviorCorrect(r) {
	assert.strictEqual(r.xmlDecl,     true);
	assert.strictEqual(r.hasSuites,   true);
	assert.strictEqual(r.suiteName,   true);
	assert.strictEqual(r.noFailure,   true);
	assert.strictEqual(r.hasFailure,  true);
	assert.strictEqual(r.hasSkipped,  true);
	assert.strictEqual(r.givenWhen,   true);
	assert.strictEqual(r.xssEscaped,  true);
	assert.strictEqual(r.countsTests, true);
	assert.strictEqual(r.twoSuites,   true);
}

when(buildJUnitBehavior)
	.hasInputs({ name: 'buildJUnit() behavior', value: null })
	.expect.output(buildJUnitBehaviorCorrect)
	.assert();

function junitReporterBehavior(_) {
	const defaultOutput = new JUnitReporter()._output;

	const writesFile = withTempDir(dir => {
		const outPath = path.join(dir, 'results.xml');
		new JUnitReporter({ output: outPath }).onSuiteEnd(makeSuite([makeTest()]));
		return fs.existsSync(outPath);
	});

	const containsSuite = withTempDir(dir => {
		const outPath = path.join(dir, 'results.xml');
		new JUnitReporter({ output: outPath }).onSuiteEnd(makeSuite([makeTest()]));
		const content = fs.readFileSync(outPath, 'utf8');
		return content.includes('<testsuite') && content.includes('name="LoginForm"');
	});

	const containsFailure = withTempDir(dir => {
		const failTest = makeTest({
			result: 'fail',
			specResults: [{ name: 'authenticates user', category: 'spec', result: 'fail', error: new Error('wrong password') }],
		});
		const outPath = path.join(dir, 'results.xml');
		new JUnitReporter({ output: outPath }).onSuiteEnd(makeSuite([failTest]));
		const content = fs.readFileSync(outPath, 'utf8');
		return content.includes('<failure') && content.includes('wrong password');
	});

	const createsNestedDirs = withTempDir(base => {
		const outPath = path.join(base, 'ci', 'reports', 'junit.xml');
		new JUnitReporter({ output: outPath }).onSuiteEnd(makeSuite([makeTest()]));
		return fs.existsSync(outPath);
	});

	return { defaultOutput, writesFile, containsSuite, containsFailure, createsNestedDirs };
}

function junitReporterBehaviorCorrect(r) {
	assert.strictEqual(r.defaultOutput,     './test-results/junit.xml');
	assert.strictEqual(r.writesFile,        true);
	assert.strictEqual(r.containsSuite,     true);
	assert.strictEqual(r.containsFailure,   true);
	assert.strictEqual(r.createsNestedDirs, true);
}

when(junitReporterBehavior)
	.hasInputs({ name: 'JUnitReporter file-writing behavior', value: null })
	.expect.output(junitReporterBehaviorCorrect)
	.assert();
