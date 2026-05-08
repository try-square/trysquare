'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { groupTests } = require('./grouping');
const { givenLabel, whenLabel, resultIcon, resolveSpecRows } = require('./label');

// PDFReporter writes asynchronously via a write stream.
// Because the runner does not await reporter events, expose this.finished — a Promise that
// resolves once the PDF is fully written. Await it after runner.run() when the output path matters.
//
// Example:
//   const pdf = new PDFReporter({ output: './docs/spec.pdf' });
//   runner.register(pdf);
//   await runner.run();
//   await pdf.finished;
class PDFReporter {
	constructor(options) {
		this._output = (options && options.output) ? options.output : './spec.pdf';
		this.finished = Promise.resolve();
	}

	onSuiteStart(suite) {}
	onTestStart(test) {}
	onTestPass(test) {}
	onTestFail(test) {}
	onTestSkip(test) {}

	onSuiteEnd(suite) {
		const outputPath = path.resolve(this._output);
		fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		this.finished = writePDF(suite.tests, outputPath);
	}
}

function writePDF(tests, outputPath) {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 50, size: 'A4' });
		const stream = fs.createWriteStream(outputPath);

		doc.pipe(stream);
		renderPDF(doc, tests);
		doc.end();

		stream.on('finish', resolve);
		stream.on('error', reject);
	});
}

function renderPDF(doc, tests) {
	const components = groupTests(tests);

	const TITLE_SIZE = 20;
	const GIVEN_SIZE = 14;
	const WHEN_SIZE = 12;
	const BODY_SIZE = 10;
	const LABEL_SIZE = 9;

	const BLACK = '#1a1a1a';
	const GRAY = '#6b7280';
	const GREEN = '#15803d';
	const RED = '#dc2626';
	const LIGHT_GRAY = '#9ca3af';

	doc.fontSize(TITLE_SIZE).fillColor(BLACK).text('Test Specification', { underline: false });
	doc.moveDown(0.5);
	doc.fontSize(BODY_SIZE).fillColor(GRAY).text(`${tests.length} tests`);
	doc.moveDown(1.5);

	for (let ci = 0; ci < components.length; ci++) {
		const comp = components[ci];

		if (ci > 0) {
			doc.addPage();
		}

		doc.fontSize(TITLE_SIZE).fillColor(BLACK).text(comp.component);
		doc.moveDown(0.5);

		for (const group of comp.baseGroups) {
			const given = givenLabel(group.tests[0]);
			if (given) {
				doc.moveDown(0.5);
				doc.fontSize(GIVEN_SIZE).fillColor(BLACK).text(given);
				doc.moveDown(0.3);
			}

			for (const test of group.tests) {
				const when = whenLabel(test);

				if (when) {
					doc.fontSize(WHEN_SIZE).fillColor(GRAY).text(when);
					doc.moveDown(0.2);
				}

				if (test.result === 'skip') {
					doc.fontSize(BODY_SIZE).fillColor(LIGHT_GRAY).text('(skipped)');
					doc.moveDown(0.3);
					continue;
				}

				if (test.result === 'fail' && test.specResults && test.specResults.length === 0 && test.error) {
					doc.fontSize(BODY_SIZE).fillColor(RED).text(test.error.message);
					doc.moveDown(0.3);
					continue;
				}

				const { mainSpecs, sideEffects } = resolveSpecRows(test);
				const mainHeader = test.type === 'output' ? 'Output' : 'Behaviors';

				if (mainSpecs.length > 0) {
					doc.fontSize(LABEL_SIZE).fillColor(GRAY).text(mainHeader.toUpperCase());
					for (const sr of mainSpecs) {
						const color = sr.result === 'pass' ? GREEN : sr.result === 'fail' ? RED : LIGHT_GRAY;
						doc.fontSize(BODY_SIZE).fillColor(color).text(`  ${resultIcon(sr.result)} ${sr.name}`);
					}
					doc.moveDown(0.2);
				}

				if (sideEffects.length > 0) {
					doc.fontSize(LABEL_SIZE).fillColor(GRAY).text('SIDE EFFECTS');
					for (const sr of sideEffects) {
						const color = sr.result === 'pass' ? GREEN : sr.result === 'fail' ? RED : LIGHT_GRAY;
						doc.fontSize(BODY_SIZE).fillColor(color).text(`  ${resultIcon(sr.result)} ${sr.name}`);
					}
					doc.moveDown(0.2);
				}

				doc.moveDown(0.3);
			}

			doc.moveDown(0.5);
		}
	}
}

module.exports = { PDFReporter };
