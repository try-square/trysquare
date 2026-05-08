'use strict';

function renderHtml(docs, options) {
	const opts = options || {};
	const title = opts.title || 'API Reference';

	const body = docs.map(renderComponent).join('\n\n');

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; color: #1a1a1a; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2.5rem; }
  h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #374151; }
  h3 { font-size: 0.95rem; margin-top: 1.25rem; color: #6b7280; }
  pre { background: #f3f4f6; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.875rem; }
  code { font-family: ui-monospace, monospace; font-size: 0.875em; background: #f3f4f6; padding: 0.15em 0.35em; border-radius: 3px; }
  pre code { background: none; padding: 0; }
  .description { color: #4b5563; margin: 0.5rem 0 1rem; }
  .param-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin: 0.75rem 0; }
  .param-table th { text-align: left; padding: 0.4rem 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; }
  .param-table td { padding: 0.4rem 0.75rem; border: 1px solid #e5e7eb; vertical-align: top; }
  .type-badge { color: #2563eb; font-family: ui-monospace, monospace; font-size: 0.8em; }
  .returns-list, .side-effects-list { list-style: none; padding: 0; margin: 0.5rem 0; }
  .returns-list li, .side-effects-list li { padding: 0.2rem 0; font-size: 0.875rem; }
  .returns-list li::before { content: "→ "; color: #6b7280; }
  .side-effects-list li::before { content: "⚡ "; }
  .section-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 1rem 0 0.25rem; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 2.5rem 0; }
</style>
</head>
<body>
<h1 class="doc-title">${escHtml(title)}</h1>
${body}
</body>
</html>`;
}

function renderComponent(comp) {
	const parts = [];

	parts.push(`<section id="${escAttr(comp.component)}">`);
	parts.push(`<h1>${escHtml(comp.component)}</h1>`);

	if (comp.signature) {
		parts.push(`<pre><code>${escHtml(formatSignature(comp.component, comp.signature))}</code></pre>`);
	}

	if (comp.description) {
		parts.push(`<p class="description">${escHtml(comp.description)}</p>`);
	}

	for (const scenario of comp.scenarios) {
		const inputLabel = scenario.inputs.map(function getInputName(i) { return i.name; }).join(', ');
		parts.push(`<h2>${escHtml(inputLabel)}</h2>`);

		if (scenario.inputs.some(function hasDesc(i) { return i.description || i.type; })) {
			parts.push('<table class="param-table">');
			parts.push('<tr><th>Parameter</th><th>Type</th><th>Value</th><th>Description</th></tr>');
			for (const input of scenario.inputs) {
				parts.push(
					`<tr>` +
					`<td><code>${escHtml(input.name)}</code></td>` +
					`<td><span class="type-badge">${escHtml(input.type || '—')}</span></td>` +
					`<td><code>${escHtml(formatValue(input.value))}</code></td>` +
					`<td>${escHtml(input.description || '')}</td>` +
					`</tr>`
				);
			}
			parts.push('</table>');
		}

		const multiBranch = scenario.branches.length > 1
			|| scenario.branches.some(function hasStubs(b) { return b.stubs; });

		for (const branch of scenario.branches) {
			if (multiBranch && branch.stubs) {
				parts.push(`<h3>${escHtml(branch.stubs.name)}</h3>`);
			}

			if (branch.outputs.length > 0) {
				parts.push('<p class="section-label">Returns</p>');
				parts.push('<ul class="returns-list">');
				for (const out of branch.outputs) {
					const typePart = out.returnType ? `<span class="type-badge">${escHtml(out.returnType)}</span> ` : '';
					parts.push(`<li>${typePart}${escHtml(out.name)}</li>`);
				}
				parts.push('</ul>');
			}

			if (branch.sideEffects.length > 0) {
				parts.push('<p class="section-label">Side effects</p>');
				parts.push('<ul class="side-effects-list">');
				for (const se of branch.sideEffects) {
					parts.push(`<li>${escHtml(se.name)}</li>`);
				}
				parts.push('</ul>');
			}
		}
	}

	parts.push('</section>');
	return parts.join('\n');
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

function escHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function escAttr(str) {
	return String(str).replace(/[^a-zA-Z0-9_-]/g, '-');
}

module.exports = { renderHtml };
