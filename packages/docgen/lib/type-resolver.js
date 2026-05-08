'use strict';

// Infer a type name from a runtime value. Handles primitives and common objects.
// Returns a string like 'string', 'number', 'boolean', 'null', 'array', or 'object'.
// Named types (interfaces, classes) cannot be inferred — they require explicit annotation
// or TypeScript source integration.
function inferType(value) {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (Array.isArray(value)) return 'array';
	const t = typeof value;
	if (t === 'string' || t === 'number' || t === 'boolean' || t === 'function') return t;
	if (t === 'object') {
		if (value instanceof Promise) return 'Promise';
		if (value instanceof Error) return 'Error';
		if (value instanceof Date) return 'Date';
		const ctor = value.constructor;
		if (ctor && ctor.name && ctor.name !== 'Object') return ctor.name;
		return 'object';
	}
	return t;
}

// Resolve the type for an input object.
// Explicit annotation ('type' field) takes priority over inference.
function resolveInputType(input, mode) {
	if (input.type) return input.type;
	if (mode === 'explicit') return null;
	return inferType(input.value);
}

// Resolve the return type from a spec/matcher name and the actual output value.
// Matcher names like 'equals "$1,000.00"' can be used to infer a string return type.
// Explicit 'returnType' on a matcher object takes priority.
function resolveOutputType(specs, output, mode) {
	for (const spec of specs) {
		if (spec.returnType) return spec.returnType;
	}
	if (mode === 'explicit') return null;
	if (output !== undefined) return inferType(output);
	return null;
}

// TypeScript source integration — stub for future implementation.
// When mode is 'typescript', this would use the TypeScript compiler API to read
// the .ts or .d.ts file for the given function and extract its full signature.
function resolveTypeScriptSignature(componentFn, tsconfig) {
	// TODO: implement using TypeScript compiler API
	// 1. Locate source file from componentFn using source maps or stack trace
	// 2. Parse with ts.createProgram({ configFilePath: tsconfig })
	// 3. Find the function declaration and extract its full signature
	// 4. Return { params: [{ name, type }], returnType }
	return null;
}

module.exports = { inferType, resolveInputType, resolveOutputType, resolveTypeScriptSignature };
