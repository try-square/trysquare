'use strict';

const { resolveInputType, resolveOutputType, resolveTypeScriptSignature } = require('./type-resolver');

// Builds a structured documentation model from an array of test objects.
// The model is format-agnostic — renderers (markdown, html) consume it.
//
// Structure:
//   [
//     {
//       component: string,
//       description: string | null,
//       signature: { params, returnType } | null,   // from TypeScript if available
//       scenarios: [
//         {
//           _baseId: string,
//           inputs: [{ name, value, type, description }],
//           stubs: { name } | null,
//           branches: [
//             {
//               type: 'output' | 'behavioral' | 'interaction',
//               outputs: [{ name, returnType }],
//               sideEffects: [{ name }],
//             }
//           ]
//         }
//       ]
//     }
//   ]

function buildDocs(tests, options) {
	const opts = options || {};
	const typeMode = opts.types || 'infer';
	const tsconfig = opts.tsconfig || null;

	const byComponent = new Map();

	for (const test of tests) {
		const key = test.component;
		if (!byComponent.has(key)) {
			byComponent.set(key, {
				component: test.component,
				description: test.componentDescription || null,
				signature: resolveSignature(test, typeMode, tsconfig),
				_scenarioMap: new Map(),
				scenarios: [],
			});
		}
		const compDoc = byComponent.get(key);

		// Update description if a later test has one and the earlier didn't
		if (!compDoc.description && test.componentDescription) {
			compDoc.description = test.componentDescription;
		}

		const baseId = test._baseId || test.component;
		if (!compDoc._scenarioMap.has(baseId)) {
			const scenario = {
				_baseId: baseId,
				inputs: normalizeInputs(test.inputs, typeMode),
				stubs: test.stubs ? { name: test.stubs.name } : null,
				branches: [],
			};
			compDoc._scenarioMap.set(baseId, scenario);
			compDoc.scenarios.push(scenario);
		}
		const scenario = compDoc._scenarioMap.get(baseId);

		const actualOutput = test._output;
		scenario.branches.push({
			type: test.type,
			stubs: test.stubs ? { name: test.stubs.name } : null,
			outputs: normalizeSpecs(test.specs, actualOutput, typeMode),
			sideEffects: normalizeSpecs(test.sideEffects, actualOutput, typeMode),
			result: test.result,
		});
	}

	return Array.from(byComponent.values()).map(function stripInternal(comp) {
		const { _scenarioMap, ...rest } = comp;
		return rest;
	});
}

function normalizeInputs(inputs, typeMode) {
	return inputs.map(function normalizeInput(input) {
		return {
			name: input.name,
			value: input.value,
			type: resolveInputType(input, typeMode),
			description: input.description || null,
		};
	});
}

function normalizeSpecs(specs, output, typeMode) {
	return specs.map(function normalizeSpec(spec) {
		return {
			name: spec.name,
			returnType: resolveOutputType([spec], output, typeMode),
		};
	});
}

function resolveSignature(test, typeMode, tsconfig) {
	if (typeMode === 'typescript' && test.componentFn) {
		return resolveTypeScriptSignature(test.componentFn, tsconfig);
	}
	return null;
}

module.exports = { buildDocs };
