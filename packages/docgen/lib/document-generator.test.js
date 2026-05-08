'use strict';

const assert = require('node:assert/strict');
const fs     = require('node:fs');
const os     = require('node:os');
const path   = require('node:path');
const { createRunner }      = require('@trysquare/core');
const { buildDocs }         = require('./doc-builder');
const { inferType, resolveInputType } = require('./type-resolver');
const { renderMarkdown }    = require('./markdown-renderer');
const { renderHtml }        = require('./html-renderer');
const { DocumentGenerator } = require('./document-generator');

const { runner, when } = createRunner();

function withTempDir(fn) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trysquare-docgen-'));
	try { return fn(dir); }
	finally { fs.rmSync(dir, { recursive: true }); }
}

// ── type-resolver ─────────────────────────────────────────────────────────────

function inferTypeScenario(_) {
	return {
		string:    inferType('hello'),
		number:    inferType(42),
		boolean:   inferType(true),
		null:      inferType(null),
		undefined: inferType(undefined),
		array:     inferType([1, 2]),
		date:      inferType(new Date()),
		error:     inferType(new Error('x')),
		object:    inferType({ a: 1 }),
	};
}

function inferTypeCorrect(result) {
	assert.strictEqual(result.string,    'string');
	assert.strictEqual(result.number,    'number');
	assert.strictEqual(result.boolean,   'boolean');
	assert.strictEqual(result.null,      'null');
	assert.strictEqual(result.undefined, 'undefined');
	assert.strictEqual(result.array,     'array');
	assert.strictEqual(result.date,      'Date');
	assert.strictEqual(result.error,     'Error');
	assert.strictEqual(result.object,    'object');
}

function resolveInputTypeScenario(_) {
	return {
		explicit:     resolveInputType({ name: 'x', value: 1,     type: 'UserInput' }, 'infer'),
		inferred:     resolveInputType({ name: 'x', value: 'foo'                     }, 'infer'),
		explicitMode: resolveInputType({ name: 'x', value: 1                         }, 'explicit'),
	};
}

function resolveInputTypeCorrect(result) {
	assert.strictEqual(result.explicit,     'UserInput');
	assert.strictEqual(result.inferred,     'string');
	assert.strictEqual(result.explicitMode, null);
}

when(inferTypeScenario)
	.hasInputs({ name: 'all primitive and built-in types', value: null })
	.expect.output(inferTypeCorrect)
	.assert();

when(resolveInputTypeScenario)
	.hasInputs({ name: 'input type resolution modes', value: null })
	.expect.output(resolveInputTypeCorrect)
	.assert();

// ── doc-builder ───────────────────────────────────────────────────────────────
// Each test creates its own isolated runner so the doc-builder tests are
// independent of the outer test runner and can inspect suite results directly.

async function docBuilderBuildsModel(_) {
	const { runner: r, when: w } = createRunner();

	function formatCurrency(amount) { return '$' + amount.toFixed(2); }
	function anySpec(result) { assert.ok(typeof result === 'string'); }

	w(formatCurrency, { description: 'Formats a numeric amount as a currency string.' })
		.hasInputs({ name: 'whole dollars', value: 1000, type: 'number', description: 'Rounds to 2 decimal places' })
		.expect.output(anySpec)
		.assert();

	w(formatCurrency)
		.hasInputs({ name: 'with cents', value: 10.5 })
		.expect.output(anySpec)
		.assert();

	const suite = await r.run();
	const docs = buildDocs(suite.tests, { types: 'infer' });

	return {
		componentCount:  docs.length,
		componentName:   docs[0].component,
		description:     docs[0].description,
		scenarioCount:   docs[0].scenarios.length,
		firstInputName:  docs[0].scenarios[0].inputs[0].name,
		firstInputType:  docs[0].scenarios[0].inputs[0].type,
		firstInputDesc:  docs[0].scenarios[0].inputs[0].description,
		secondInputType: docs[0].scenarios[1].inputs[0].type,
	};
}

function docBuilderModelCorrect(result) {
	assert.strictEqual(result.componentCount,  1);
	assert.strictEqual(result.componentName,   'formatCurrency');
	assert.strictEqual(result.description,     'Formats a numeric amount as a currency string.');
	assert.strictEqual(result.scenarioCount,   2);
	assert.strictEqual(result.firstInputName,  'whole dollars');
	assert.strictEqual(result.firstInputType,  'number');
	assert.strictEqual(result.firstInputDesc,  'Rounds to 2 decimal places');
	assert.strictEqual(result.secondInputType, 'number');
}

async function docBuilderGroupsBranches(_) {
	const { runner: r, when: w } = createRunner();

	function login(creds) { return creds.user === 'alice' ? { token: 'abc' } : { error: 'bad' }; }
	function anySpec() { assert.ok(true); }

	const attempt = w(login).hasInputs({ name: 'valid credentials', value: { user: 'alice', pass: 'x' } });
	attempt.stubs({ name: 'success path', db: {} }).expect.output(anySpec).assert();
	attempt.stubs({ name: 'error path',   db: {} }).expect.output(anySpec).assert();

	const suite = await r.run();
	const docs  = buildDocs(suite.tests, { types: 'infer' });

	return {
		scenarioCount:  docs[0].scenarios.length,
		branchCount:    docs[0].scenarios[0].branches.length,
		branch0stubs:   docs[0].scenarios[0].branches[0].stubs.name,
		branch1stubs:   docs[0].scenarios[0].branches[1].stubs.name,
	};
}

function docBuilderBranchesCorrect(result) {
	assert.strictEqual(result.scenarioCount, 1,             'branches from same base = one scenario');
	assert.strictEqual(result.branchCount,   2,             'two branches');
	assert.strictEqual(result.branch0stubs,  'success path');
	assert.strictEqual(result.branch1stubs,  'error path');
}

when(docBuilderBuildsModel)
	.hasInputs({ name: 'annotated inputs and component description', value: null })
	.expect.output(docBuilderModelCorrect)
	.assert();

when(docBuilderGroupsBranches)
	.hasInputs({ name: 'multiple stubs branches on one base', value: null })
	.expect.output(docBuilderBranchesCorrect)
	.assert();

// ── DocumentGenerator reporter integration ───────────────────────────────────

async function documentGeneratorWritesFiles(_) {
	const { runner: r, when: w } = createRunner();

	function add(a, b) { return a + b; }
	function isPositive(result) { assert.ok(result > 0); }

	w(add).hasInputs({ name: 'two positives', value: 2 }).expect.output(isPositive).assert();

	const suite = await r.run();

	return withTempDir(function checkOutput(dir) {
		const gen = new DocumentGenerator({ output: dir, format: 'both' });
		gen.onSuiteEnd(suite);

		return {
			htmlExists:            fs.existsSync(path.join(dir, 'index.html')),
			mdExists:              fs.existsSync(path.join(dir, 'api.md')),
			htmlContainsComponent: fs.readFileSync(path.join(dir, 'index.html'), 'utf8').includes('add'),
			mdContainsComponent:   fs.readFileSync(path.join(dir, 'api.md'),     'utf8').includes('add'),
		};
	});
}

function documentGeneratorFilesCorrect(result) {
	assert.ok(result.htmlExists,            'index.html should exist');
	assert.ok(result.mdExists,              'api.md should exist');
	assert.ok(result.htmlContainsComponent, 'HTML should contain component name');
	assert.ok(result.mdContainsComponent,   'Markdown should contain component name');
}

async function documentGeneratorSkipsAllSkipped(_) {
	const { runner: r, when: w } = createRunner();
	function noop() {}
	function anySpec() { assert.ok(true); }
	w(noop).hasInputs({ name: 'x', value: null }).expect.output(anySpec).assert({ skip: true });
	const suite = await r.run();

	return withTempDir(function checkOutput(dir) {
		const gen = new DocumentGenerator({ output: dir });
		gen.onSuiteEnd(suite);
		return { noFiles: fs.readdirSync(dir).length === 0 };
	});
}

function documentGeneratorSkipCorrect(result) {
	assert.ok(result.noFiles, 'should write no files when all tests are skipped');
}

when(documentGeneratorWritesFiles)
	.hasInputs({ name: 'html and markdown output', value: null })
	.expect.output(documentGeneratorFilesCorrect)
	.assert();

when(documentGeneratorSkipsAllSkipped)
	.hasInputs({ name: 'all-skipped suite', value: null })
	.expect.output(documentGeneratorSkipCorrect)
	.assert();

// ── markdown renderer ─────────────────────────────────────────────────────────

function markdownRendererScenario(_) {
	const docs = [{
		component:   'formatCurrency',
		description: 'Formats a numeric amount.',
		signature:   null,
		scenarios: [{
			_baseId: 'a',
			inputs:  [{ name: 'whole dollars', value: 1000, type: 'number', description: null }],
			stubs:   null,
			branches: [{
				type:        'output',
				stubs:       null,
				outputs:     [{ name: 'equals "$1,000.00"', returnType: 'string' }],
				sideEffects: [],
				result:      'pass',
			}],
		}],
	}];
	const md = renderMarkdown(docs);
	return {
		hasH1:          md.includes('# formatCurrency'),
		hasDescription: md.includes('Formats a numeric amount.'),
		hasInputSection: md.includes('## whole dollars'),
		hasReturns:     md.includes('**Returns**'),
		hasMatcherName: md.includes('equals "$1,000.00"'),
		hasType:        md.includes('`string`'),
	};
}

function markdownRendererCorrect(result) {
	assert.ok(result.hasH1,            'H1 with component name');
	assert.ok(result.hasDescription,   'Component description');
	assert.ok(result.hasInputSection,  'H2 for input scenario');
	assert.ok(result.hasReturns,       'Returns section');
	assert.ok(result.hasMatcherName,   'Matcher name in output');
	assert.ok(result.hasType,          'Return type annotation');
}

when(markdownRendererScenario)
	.hasInputs({ name: 'single component with description and type', value: null })
	.expect.output(markdownRendererCorrect)
	.assert();

module.exports = runner;
