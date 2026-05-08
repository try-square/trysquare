'use strict';

const fs   = require('node:fs');
const path = require('node:path');
const { buildDocs }        = require('./doc-builder');
const { renderMarkdown }   = require('./markdown-renderer');
const { renderHtml }       = require('./html-renderer');

// DocumentGenerator implements the trysquare reporter interface.
// It accumulates test results during the run, then on onSuiteEnd builds
// and writes API documentation derived from the verified test chains.
//
// Configuration options:
//   output    {string}  Directory to write docs into. Default: './docs'
//   format    {string}  'html' | 'markdown' | 'both'. Default: 'html'
//   title     {string}  Title for generated HTML. Default: 'API Reference'
//   types     {string}  'infer' | 'explicit' | 'typescript'. Default: 'infer'
//   tsconfig  {string}  Path to tsconfig.json. Used when types: 'typescript'.
//
class DocumentGenerator {
	constructor(options) {
		const opts = options || {};
		this._output   = opts.output   || './docs';
		this._format   = opts.format   || 'html';
		this._title    = opts.title    || 'API Reference';
		this._types    = opts.types    || 'infer';
		this._tsconfig = opts.tsconfig || null;
	}

	onSuiteStart(_suite) {}
	onTestStart(_test) {}
	onTestPass(_test) {}
	onTestFail(_test) {}
	onTestSkip(_test) {}

	onSuiteEnd(suite) {
		const passingTests = suite.tests.filter(function passing(t) { return t.result !== 'skip'; });
		if (passingTests.length === 0) return;

		const docs = buildDocs(passingTests, {
			types:    this._types,
			tsconfig: this._tsconfig,
		});

		const outDir = path.resolve(this._output);
		fs.mkdirSync(outDir, { recursive: true });

		if (this._format === 'markdown' || this._format === 'both') {
			const content = renderMarkdown(docs);
			fs.writeFileSync(path.join(outDir, 'api.md'), content, 'utf8');
		}

		if (this._format === 'html' || this._format === 'both') {
			const content = renderHtml(docs, { title: this._title });
			fs.writeFileSync(path.join(outDir, 'index.html'), content, 'utf8');
		}
	}
}

module.exports = { DocumentGenerator };
