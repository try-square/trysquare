'use strict';

const fs = require('fs');
const path = require('path');
const { groupTests } = require('./grouping');
const { givenLabel, whenLabel, resultIcon, resolveSpecRows } = require('./label');

class MarkdownReporter {
	constructor(options) {
		this._output = (options && options.output) ? options.output : './spec.md';
	}

	onSuiteStart(suite) {}
	onTestStart(test) {}
	onTestPass(test) {}
	onTestFail(test) {}
	onTestSkip(test) {}

	onSuiteEnd(suite) {
		const content = buildMarkdown(suite.tests);
		const outputPath = path.resolve(this._output);
		fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		fs.writeFileSync(outputPath, content, 'utf8');
	}
}

function buildMarkdown(tests) {
	const lines = [];
	const components = groupTests(tests);

	for (let ci = 0; ci < components.length; ci++) {
		const comp = components[ci];
		if (ci > 0) lines.push('');
		lines.push(`# ${comp.component}`);

		for (const group of comp.baseGroups) {
			const given = givenLabel(group.tests[0]);
			if (given) {
				lines.push('');
				lines.push(`## ${given}`);
			}

			for (const test of group.tests) {
				const when = whenLabel(test);

				if (test.result === 'skip' && test.ignored) {
					if (when) { lines.push(''); lines.push(`### ${when}`); }
					lines.push('');
					lines.push('_(skipped)_');
					continue;
				}

				if (when) {
					lines.push('');
					lines.push(`### ${when}`);
				}

				lines.push('');

				if (test.result === 'fail' && test.specResults && test.specResults.length === 0 && test.error) {
					lines.push(`**Error:** ${test.error.message}`);
					lines.push('');
					continue;
				}

				const { mainSpecs, sideEffects } = resolveSpecRows(test);
				const mainHeader = test.type === 'output' ? '**Output**' : '**Behaviors**';

				if (mainSpecs.length > 0) {
					lines.push(mainHeader);
					for (const sr of mainSpecs) {
						lines.push(`- ${resultIcon(sr.result)} ${sr.name}`);
					}
					lines.push('');
				}

				if (sideEffects.length > 0) {
					lines.push('**Side effects**');
					for (const sr of sideEffects) {
						lines.push(`- ${resultIcon(sr.result)} ${sr.name}`);
					}
					lines.push('');
				}
			}
		}

		if (ci < components.length - 1) {
			lines.push('');
			lines.push('---');
		}
	}

	return lines.join('\n') + '\n';
}

module.exports = { MarkdownReporter, buildMarkdown };
