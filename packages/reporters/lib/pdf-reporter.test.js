'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { PDFReporter } = require('./pdf-reporter');

function makeTest(overrides) {
	return Object.assign({
		component: 'InvoiceRenderer',
		_baseId: 'b1',
		inputs: [{ name: 'valid invoice' }],
		stubs: { name: 'payment API' },
		lifecycleState: null,
		userActions: [],
		type: 'output',
		specs: [{ name: 'renders total correctly' }],
		sideEffects: [],
		result: 'pass',
		duration: 15,
		error: null,
		specResults: [{ name: 'renders total correctly', category: 'spec', result: 'pass' }],
	}, overrides);
}

function makeSuite(tests) {
	return { tests, startTime: Date.now(), endTime: Date.now() + 20, duration: 20, passed: tests.filter(t => t.result === 'pass').length, failed: tests.filter(t => t.result === 'fail').length, skipped: tests.filter(t => t.result === 'skip').length };
}

async function pdfReporterFilesBehavior(_) {
	async function withTempDir(fn) {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trysquare-pdf-'));
		try { return await fn(dir); }
		finally { fs.rmSync(dir, { recursive: true }); }
	}

	const writesNonEmpty = await withTempDir(async dir => {
		const outPath = path.join(dir, 'spec.pdf');
		const reporter = new PDFReporter({ output: outPath });
		reporter.onSuiteEnd(makeSuite([makeTest()]));
		await reporter.finished;
		return fs.existsSync(outPath) && fs.statSync(outPath).size > 0;
	});

	const isPdf = await withTempDir(async dir => {
		const outPath = path.join(dir, 'spec.pdf');
		const reporter = new PDFReporter({ output: outPath });
		reporter.onSuiteEnd(makeSuite([makeTest()]));
		await reporter.finished;
		const buf = Buffer.alloc(4);
		const fd  = fs.openSync(outPath, 'r');
		fs.readSync(fd, buf, 0, 4, 0);
		fs.closeSync(fd);
		return buf.toString('ascii');
	});

	const createsNestedDirs = await withTempDir(async base => {
		const outPath = path.join(base, 'reports', 'spec.pdf');
		const reporter = new PDFReporter({ output: outPath });
		reporter.onSuiteEnd(makeSuite([makeTest()]));
		await reporter.finished;
		return fs.existsSync(outPath);
	});

	const handlesMultiple = await withTempDir(async dir => {
		const tests = [
			makeTest({ component: 'InvoiceRenderer', _baseId: 'a1' }),
			makeTest({ component: 'InvoiceRenderer', _baseId: 'a1', stubs: { name: 'error path' }, result: 'fail',
				specResults: [{ name: 'renders total correctly', category: 'spec', result: 'fail', error: new Error('wrong total') }] }),
			makeTest({ component: 'PaymentProcessor', _baseId: 'b1', result: 'skip', specResults: [] }),
		];
		const outPath = path.join(dir, 'multi.pdf');
		const reporter = new PDFReporter({ output: outPath });
		reporter.onSuiteEnd(makeSuite(tests));
		await reporter.finished;
		return fs.statSync(outPath).size > 0;
	});

	return { writesNonEmpty, isPdfHeader: isPdf, createsNestedDirs, handlesMultiple };
}

function pdfReporterFilesBehaviorCorrect(r) {
	assert.strictEqual(r.writesNonEmpty,    true);
	assert.strictEqual(r.isPdfHeader,       '%PDF');
	assert.strictEqual(r.createsNestedDirs, true);
	assert.strictEqual(r.handlesMultiple,   true);
}

when(pdfReporterFilesBehavior)
	.hasInputs({ name: 'PDFReporter file-writing behavior', value: null })
	.expect.output(pdfReporterFilesBehaviorCorrect)
	.assert({ timeout: 15000 });

async function pdfReporterMetaBehavior(_) {
	const defaultOutput = new PDFReporter()._output;

	const reporter = new PDFReporter({ output: '/nonexistent-path-never-written' });
	let finishedThrew = null;
	try { await reporter.finished; }
	catch (e) { finishedThrew = e; }

	return { defaultOutput, finishedThrew };
}

function pdfReporterMetaBehaviorCorrect(r) {
	assert.strictEqual(r.defaultOutput,  './spec.pdf');
	assert.strictEqual(r.finishedThrew,  null);
}

when(pdfReporterMetaBehavior)
	.hasInputs({ name: 'PDFReporter meta behavior', value: null })
	.expect.output(pdfReporterMetaBehaviorCorrect)
	.assert();
