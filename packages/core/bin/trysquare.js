#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const runner = require('../lib/runner');
const { ConsoleReporter } = require('../lib/reporter');

const cwd = process.cwd();

// Decision (section 13 — test file discovery): convention-based glob (**/*.test.js)
// with config override. The runner does not assume a specific naming convention —
// testMatch in test.config.js overrides the default.

function main() {
	const config = loadConfig();

	runner.configure({
		execution: config.execution || 'sequential',
		timeout: config.timeout != null ? config.timeout : 5000,
		retries: config.retries != null ? config.retries : 0,
		focusInCIBehavior: config.focusInCIBehavior || 'error',
		batchSize: config.batchSize,
	});

	const reporters = resolveReporters(config.reporters || [['console']]);
	for (const r of reporters) {
		runner.register(r);
	}

	const patterns = config.testMatch || ['**/*.test.js'];
	const ignore = config.ignore || ['node_modules', '.git', 'coverage', 'dist'];
	const testFiles = findTestFiles(cwd, patterns, ignore);

	if (testFiles.length === 0) {
		console.error(`[trysquare] No test files found matching: ${patterns.join(', ')}`);
		process.exit(1);
	}

	for (const file of testFiles) {
		require(file);
	}

	runner.run().then(suite => {
		if (suite.failed > 0) process.exit(1);
	}).catch(err => {
		console.error('[trysquare]', err.message);
		process.exit(1);
	});
}

function loadConfig() {
	const configPath = path.join(cwd, 'test.config.js');
	if (fs.existsSync(configPath)) {
		try {
			return require(configPath);
		} catch (err) {
			console.error(`[trysquare] Failed to load test.config.js: ${err.message}`);
			process.exit(1);
		}
	}
	return {};
}

function resolveReporters(specs) {
	const resolved = [];
	for (const spec of specs) {
		if (Array.isArray(spec)) {
			const [name, opts] = spec;
			if (name === 'console') {
				resolved.push(new ConsoleReporter());
				continue;
			}
			// Future: try require('@trysquare/reporters/' + name) once that package exists.
			const pkgName = `@trysquare/reporters`;
			try {
				const reporters = require(pkgName);
				const ReporterClass = reporters[name] || reporters[capitalize(name) + 'Reporter'];
				if (ReporterClass) {
					resolved.push(new ReporterClass(opts || {}));
					continue;
				}
			} catch {
				// @trysquare/reporters not installed
			}
			console.warn(`[trysquare] Unknown reporter '${name}'. Install @trysquare/reporters for markdown/html/pdf/junit.`);
		} else if (spec && typeof spec.onSuiteStart === 'function') {
			resolved.push(spec);
		}
	}
	return resolved;
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function findTestFiles(rootDir, patterns, ignore) {
	const results = [];
	walk(rootDir, patterns, ignore, results);
	return results.sort();
}

function walk(dir, patterns, ignore, results) {
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		if (ignore.includes(entry.name)) continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(fullPath, patterns, ignore, results);
		} else if (entry.isFile() && matchesAny(entry.name, patterns)) {
			results.push(fullPath);
		}
	}
}

function matchesAny(filename, patterns) {
	return patterns.some(pattern => matchesPattern(filename, pattern));
}

function matchesPattern(filename, pattern) {
	// **/*.test.js  →  any file ending in .test.js
	// *.test.js     →  any file ending in .test.js (same, since we match on filename only)
	// foo.test.js   →  exact filename match
	const suffix = pattern.replace(/^\*\*\//, '').replace(/^\*/, '');
	if (suffix.startsWith('.')) {
		return filename.endsWith(suffix);
	}
	return filename === pattern;
}

main();
