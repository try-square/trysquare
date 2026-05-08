'use strict';

const fs = require('fs');
const path = require('path');
const { groupTests } = require('./grouping');
const { givenLabel, whenLabel, resultIcon, resolveSpecRows, slugify } = require('./label');

class HTMLReporter {
	constructor(options) {
		this._output = (options && options.output) ? options.output : './spec-docs';
	}

	onSuiteStart(suite) {}
	onTestStart(test) {}
	onTestPass(test) {}
	onTestFail(test) {}
	onTestSkip(test) {}

	onSuiteEnd(suite) {
		const outputDir = path.resolve(this._output);
		fs.mkdirSync(outputDir, { recursive: true });

		const components = groupTests(suite.tests);
		const summaries = components.map(comp => buildComponentSummary(comp));

		fs.writeFileSync(path.join(outputDir, 'index.html'), buildIndexHTML(summaries, suite), 'utf8');

		for (let i = 0; i < components.length; i++) {
			const comp = components[i];
			const filename = slugify(comp.component) + '.html';
			fs.writeFileSync(path.join(outputDir, filename), buildComponentHTML(comp, summaries[i]), 'utf8');
		}
	}
}

function buildComponentSummary(comp) {
	let passed = 0, failed = 0, skipped = 0;
	for (const group of comp.baseGroups) {
		for (const test of group.tests) {
			if (test.result === 'pass') passed++;
			else if (test.result === 'fail') failed++;
			else skipped++;
		}
	}
	return { component: comp.component, slug: slugify(comp.component), passed, failed, skipped };
}

function buildIndexHTML(summaries, suite) {
	const totalPassed = suite.passed || 0;
	const totalFailed = suite.failed || 0;
	const totalSkipped = suite.skipped || 0;
	const totalTests = totalPassed + totalFailed + totalSkipped;
	const statusClass = totalFailed > 0 ? 'fail' : 'pass';

	const rows = summaries.map(s => {
		const rowClass = s.failed > 0 ? 'fail' : (s.skipped > 0 && s.passed === 0 ? 'skip' : 'pass');
		return `\t\t\t<tr class="${rowClass}">
\t\t\t\t<td><a href="${s.slug}.html">${esc(s.component)}</a></td>
\t\t\t\t<td>${s.passed + s.failed + s.skipped}</td>
\t\t\t\t<td>${s.passed}</td>
\t\t\t\t<td>${s.failed}</td>
\t\t\t\t<td>${s.skipped}</td>
\t\t\t</tr>`;
	}).join('\n');

	return `<!DOCTYPE html>
<html lang="en">
<head>
\t<meta charset="UTF-8">
\t<meta name="viewport" content="width=device-width, initial-scale=1.0">
\t<title>Test Specification</title>
\t<style>${CSS}</style>
</head>
<body>
\t<header>
\t\t<h1>Test Specification</h1>
\t\t<p class="summary ${statusClass}">${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped — ${totalTests} total</p>
\t</header>
\t<main>
\t\t<table>
\t\t\t<thead>
\t\t\t\t<tr>
\t\t\t\t\t<th>Component</th>
\t\t\t\t\t<th>Tests</th>
\t\t\t\t\t<th>Passed</th>
\t\t\t\t\t<th>Failed</th>
\t\t\t\t\t<th>Skipped</th>
\t\t\t\t</tr>
\t\t\t</thead>
\t\t\t<tbody>
${rows}
\t\t\t</tbody>
\t\t</table>
\t</main>
</body>
</html>
`;
}

function buildComponentHTML(comp, summary) {
	const sections = comp.baseGroups.map(group => buildGroupHTML(group)).join('\n');

	return `<!DOCTYPE html>
<html lang="en">
<head>
\t<meta charset="UTF-8">
\t<meta name="viewport" content="width=device-width, initial-scale=1.0">
\t<title>${esc(comp.component)} — Test Specification</title>
\t<style>${CSS}</style>
</head>
<body>
\t<header>
\t\t<p><a href="index.html">← Index</a></p>
\t\t<h1>${esc(comp.component)}</h1>
\t\t<p class="summary ${summary.failed > 0 ? 'fail' : 'pass'}">${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped</p>
\t</header>
\t<main>
${sections}
\t</main>
</body>
</html>
`;
}

function buildGroupHTML(group) {
	const given = givenLabel(group.tests[0]);
	const tests = group.tests.map(test => buildTestHTML(test)).join('\n');

	if (given) {
		return `\t\t<section class="group">
\t\t\t<h2>${esc(given)}</h2>
${tests}
\t\t</section>`;
	}
	return tests;
}

function buildTestHTML(test) {
	const when = whenLabel(test);
	const header = when ? `\t\t\t<h3>${esc(when)}</h3>` : '';

	if (test.result === 'skip') {
		return `\t\t\t<section class="test skip">
${header}
\t\t\t\t<p class="skipped">skipped</p>
\t\t\t</section>`;
	}

	if (test.result === 'fail' && test.specResults && test.specResults.length === 0 && test.error) {
		return `\t\t\t<section class="test fail">
${header}
\t\t\t\t<p class="error">${esc(test.error.message)}</p>
\t\t\t</section>`;
	}

	const { mainSpecs, sideEffects } = resolveSpecRows(test);
	const mainHeader = test.type === 'output' ? 'Output' : 'Behaviors';
	const testClass = test.result === 'fail' ? 'fail' : 'pass';

	let content = '';
	if (mainSpecs.length > 0) {
		content += `\t\t\t\t<div class="spec-group">
\t\t\t\t\t<h4>${mainHeader}</h4>
\t\t\t\t\t<ul>
${mainSpecs.map(sr => `\t\t\t\t\t\t<li class="${sr.result}">${resultIcon(sr.result)} ${esc(sr.name)}</li>`).join('\n')}
\t\t\t\t\t</ul>
\t\t\t\t</div>`;
	}
	if (sideEffects.length > 0) {
		content += `\n\t\t\t\t<div class="spec-group">
\t\t\t\t\t<h4>Side effects</h4>
\t\t\t\t\t<ul>
${sideEffects.map(sr => `\t\t\t\t\t\t<li class="${sr.result}">${resultIcon(sr.result)} ${esc(sr.name)}</li>`).join('\n')}
\t\t\t\t\t</ul>
\t\t\t\t</div>`;
	}

	return `\t\t\t<section class="test ${testClass}">
${header}
${content}
\t\t\t</section>`;
}

function esc(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

const CSS = `
	* { box-sizing: border-box; margin: 0; padding: 0; }
	body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #1a1a1a; background: #fafafa; }
	header { padding: 24px 32px; border-bottom: 1px solid #e5e7eb; background: #fff; }
	header h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
	header p { font-size: 13px; color: #6b7280; }
	header a { color: #2563eb; text-decoration: none; }
	main { padding: 32px; max-width: 900px; }
	h2 { font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: #374151; }
	h3 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; color: #4b5563; }
	h4 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; }
	table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
	th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; padding: 10px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
	td { padding: 10px 16px; border-bottom: 1px solid #f3f4f6; }
	tr:last-child td { border-bottom: none; }
	tr.fail td:first-child { border-left: 3px solid #ef4444; }
	tr.pass td:first-child { border-left: 3px solid #22c55e; }
	a { color: #2563eb; text-decoration: none; }
	a:hover { text-decoration: underline; }
	.summary.pass { color: #16a34a; }
	.summary.fail { color: #dc2626; }
	.group { margin-bottom: 32px; }
	.test { margin-bottom: 20px; padding: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; }
	.test.fail { border-left: 3px solid #ef4444; }
	.test.pass { border-left: 3px solid #22c55e; }
	.test.skip { border-left: 3px solid #d1d5db; opacity: 0.6; }
	ul { list-style: none; padding: 0; }
	li { padding: 3px 0; font-size: 13px; }
	li.pass { color: #15803d; }
	li.fail { color: #dc2626; }
	li.skip { color: #6b7280; }
	.spec-group { margin-top: 12px; }
	.skipped { color: #6b7280; font-style: italic; font-size: 13px; }
	.error { color: #dc2626; font-size: 13px; }
`;

module.exports = { HTMLReporter, buildIndexHTML, buildComponentHTML };
