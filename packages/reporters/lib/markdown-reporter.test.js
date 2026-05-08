'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { buildMarkdown, MarkdownReporter } = require('./markdown-reporter');

function makeTest(overrides) {
	return Object.assign({
		component: 'MyComponent',
		_baseId: 'b1',
		inputs: [{ name: 'valid input' }],
		stubs: null,
		lifecycleState: null,
		userActions: [],
		type: 'output',
		specs: [{ name: 'returns expected value' }],
		sideEffects: [],
		result: 'pass',
		ignored: false,
		error: null,
		specResults: [{ name: 'returns expected value', category: 'spec', result: 'pass' }],
	}, overrides);
}

function makeSuite(tests) {
	return { tests, startTime: Date.now(), endTime: Date.now() + 10, duration: 10, passed: tests.filter(t => t.result === 'pass').length, failed: tests.filter(t => t.result === 'fail').length, skipped: tests.filter(t => t.result === 'skip').length };
}

function withTempDir(fn) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trysquare-md-'));
	try { return fn(dir); }
	finally { fs.rmSync(dir, { recursive: true }); }
}

function buildMarkdownBehavior(_) {
	const basic      = buildMarkdown([makeTest()]);
	const namedComp  = buildMarkdown([makeTest({ component: 'FooParser' })]);
	const withStubs_ = buildMarkdown([makeTest({ stubs: { name: 'happy path API' } })]);
	const withState  = buildMarkdown([makeTest({ stubs: null, lifecycleState: { name: 'still initializing' } })]);
	const failing    = buildMarkdown([makeTest({
		result: 'fail',
		specResults: [{ name: 'returns expected value', category: 'spec', result: 'fail', error: new Error('wrong') }],
	})]);
	const behavioral = buildMarkdown([makeTest({
		type: 'behavioral',
		specs: [{ name: 'shows error' }],
		specResults: [{ name: 'shows error', category: 'spec', result: 'pass' }],
	})]);
	const sideEffects_ = buildMarkdown([makeTest({
		sideEffects: [{ name: 'logs to monitoring' }],
		specResults: [
			{ name: 'returns expected value', category: 'spec', result: 'pass' },
			{ name: 'logs to monitoring', category: 'sideEffect', result: 'pass' },
		],
	})]);
	const curried = buildMarkdown([makeTest({ inputs: [{ name: 'first operand' }, { name: 'second operand' }] })]);
	const twoComps = buildMarkdown([
		makeTest({ component: 'Alpha', _baseId: 'a1' }),
		makeTest({ component: 'Beta', _baseId: 'b1' }),
	]);
	const branches = buildMarkdown([
		makeTest({ stubs: { name: 'happy path' }, _baseId: 'b1' }),
		makeTest({ stubs: { name: 'error path' }, _baseId: 'b1' }),
	]);
	const ignored_    = buildMarkdown([makeTest({ result: 'skip', ignored: true })]);
	const compError   = buildMarkdown([makeTest({ result: 'fail', specResults: [], error: new Error('component exploded') })]);
	const notReached  = buildMarkdown([makeTest({
		result: 'fail',
		specs: [{ name: 'first spec' }, { name: 'second spec' }],
		specResults: [{ name: 'first spec', category: 'spec', result: 'fail', error: new Error('nope') }],
	})]);

	return {
		h1:               namedComp.includes('# FooParser'),
		h2Given:          basic.includes('## Given: valid input'),
		whenStubs:        withStubs_.includes('### When: happy path API'),
		whenState:        withState.includes('### When: still initializing'),
		passingCheck:     basic.includes('✓ returns expected value'),
		failingCross:     failing.includes('✗ returns expected value'),
		outputHeader:     basic.includes('**Output**'),
		behaviorsHeader:  behavioral.includes('**Behaviors**'),
		sideEffects:      sideEffects_.includes('**Side effects**') && sideEffects_.includes('✓ logs to monitoring'),
		curriedArrow:     curried.includes('Given: first operand → second operand'),
		twoCompsHr:       twoComps.includes('# Alpha') && twoComps.includes('# Beta') && twoComps.includes('---'),
		branchedGiven:    (branches.match(/## Given:/g) || []).length === 1,
		branchedWhen:     branches.includes('### When: happy path') && branches.includes('### When: error path'),
		ignoredSkipped:   ignored_.includes('_(skipped)_'),
		compError:        compError.includes('**Error:** component exploded'),
		notReachedDash:   notReached.includes('✗ first spec') && notReached.includes('- second spec'),
	};
}

function buildMarkdownBehaviorCorrect(r) {
	assert.strictEqual(r.h1,              true);
	assert.strictEqual(r.h2Given,         true);
	assert.strictEqual(r.whenStubs,       true);
	assert.strictEqual(r.whenState,       true);
	assert.strictEqual(r.passingCheck,    true);
	assert.strictEqual(r.failingCross,    true);
	assert.strictEqual(r.outputHeader,    true);
	assert.strictEqual(r.behaviorsHeader, true);
	assert.strictEqual(r.sideEffects,     true);
	assert.strictEqual(r.curriedArrow,    true);
	assert.strictEqual(r.twoCompsHr,      true);
	assert.strictEqual(r.branchedGiven,   true);
	assert.strictEqual(r.branchedWhen,    true);
	assert.strictEqual(r.ignoredSkipped,  true);
	assert.strictEqual(r.compError,       true);
	assert.strictEqual(r.notReachedDash,  true);
}

when(buildMarkdownBehavior)
	.hasInputs({ name: 'buildMarkdown() behavior', value: null })
	.expect.output(buildMarkdownBehaviorCorrect)
	.assert();

function markdownReporterBehavior(_) {
	const defaultOutput = new MarkdownReporter()._output;

	const writesFile = withTempDir(dir => {
		const outPath = path.join(dir, 'spec.md');
		new MarkdownReporter({ output: outPath }).onSuiteEnd(makeSuite([makeTest()]));
		return fs.existsSync(outPath);
	});

	const containsComponent = withTempDir(dir => {
		const outPath = path.join(dir, 'spec.md');
		new MarkdownReporter({ output: outPath }).onSuiteEnd(makeSuite([makeTest({ component: 'PaymentProcessor' })]));
		return fs.readFileSync(outPath, 'utf8').includes('# PaymentProcessor');
	});

	const createsNestedDirs = withTempDir(dir => {
		const outPath = path.join(dir, 'nested', 'deep', 'spec.md');
		new MarkdownReporter({ output: outPath }).onSuiteEnd(makeSuite([makeTest()]));
		return fs.existsSync(outPath);
	});

	const reflectsFailure = withTempDir(dir => {
		const failTest = makeTest({
			result: 'fail',
			specResults: [{ name: 'returns expected value', category: 'spec', result: 'fail', error: new Error('wrong') }],
		});
		const outPath = path.join(dir, 'spec.md');
		new MarkdownReporter({ output: outPath }).onSuiteEnd(makeSuite([failTest]));
		return fs.readFileSync(outPath, 'utf8').includes('✗ returns expected value');
	});

	return { defaultOutput, writesFile, containsComponent, createsNestedDirs, reflectsFailure };
}

function markdownReporterBehaviorCorrect(r) {
	assert.strictEqual(r.defaultOutput,      './spec.md');
	assert.strictEqual(r.writesFile,         true);
	assert.strictEqual(r.containsComponent,  true);
	assert.strictEqual(r.createsNestedDirs,  true);
	assert.strictEqual(r.reflectsFailure,    true);
}

when(markdownReporterBehavior)
	.hasInputs({ name: 'MarkdownReporter file-writing behavior', value: null })
	.expect.output(markdownReporterBehaviorCorrect)
	.assert();
