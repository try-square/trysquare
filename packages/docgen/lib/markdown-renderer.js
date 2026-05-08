'use strict';

function renderMarkdown(docs) {
	const sections = [];

	for (let i = 0; i < docs.length; i++) {
		const comp = docs[i];
		const lines = [];

		lines.push(`# ${comp.component}`);

		if (comp.signature) {
			lines.push('');
			lines.push(`\`\`\`typescript`);
			lines.push(formatSignature(comp.component, comp.signature));
			lines.push('```');
		}

		if (comp.description) {
			lines.push('');
			lines.push(comp.description);
		}

		for (const scenario of comp.scenarios) {
			const inputLabel = scenario.inputs.map(i => i.name).join(', ');
			lines.push('');
			lines.push(`## ${inputLabel}`);

			if (scenario.inputs.some(i => i.description)) {
				lines.push('');
				lines.push('**Parameters**');
				for (const input of scenario.inputs) {
					const typePart = input.type ? ` \`${input.type}\`` : '';
					const descPart = input.description ? ` — ${input.description}` : '';
					lines.push(`- \`${input.name}\`${typePart}${descPart}: \`${formatValue(input.value)}\``);
				}
			}

			const multiBranch = scenario.branches.length > 1
				|| scenario.branches.some(b => b.stubs);

			for (const branch of scenario.branches) {
				if (multiBranch && branch.stubs) {
					lines.push('');
					lines.push(`### ${branch.stubs.name}`);
				}

				if (branch.outputs.length > 0) {
					lines.push('');
					lines.push('**Returns**');
					for (const out of branch.outputs) {
						const typePart = out.returnType ? ` \`${out.returnType}\`` : '';
						lines.push(`-${typePart} ${out.name}`);
					}
				}

				if (branch.sideEffects.length > 0) {
					lines.push('');
					lines.push('**Side effects**');
					for (const se of branch.sideEffects) {
						lines.push(`- ${se.name}`);
					}
				}
			}
		}

		sections.push(lines.join('\n'));
	}

	return sections.join('\n\n---\n\n') + '\n';
}

function formatSignature(name, sig) {
	if (!sig) return name;
	const params = (sig.params || []).map(function formatParam(p) {
		return p.type ? `${p.name}: ${p.type}` : p.name;
	}).join(', ');
	const ret = sig.returnType ? `: ${sig.returnType}` : '';
	return `function ${name}(${params})${ret}`;
}

function formatValue(value) {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return `"${value}"`;
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

module.exports = { renderMarkdown };
