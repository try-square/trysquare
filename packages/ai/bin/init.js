#!/usr/bin/env node
'use strict';

const fs   = require('node:fs');
const path = require('node:path');

const CONTEXT_FILE = path.join(__dirname, '..', 'context.md');
const MARKER       = '<!-- trysquare-ai-context -->';

const TOOLS = {
	claude:   { files: ['CLAUDE.md'],                              label: 'Claude Code'         },
	cursor:   { files: ['.cursorrules'],                           label: 'Cursor'              },
	copilot:  { files: ['.github/copilot-instructions.md'],        label: 'GitHub Copilot'      },
	windsurf: { files: ['.windsurfrules'],                         label: 'Windsurf'            },
	codex:    { files: ['AGENTS.md'],                              label: 'OpenAI Codex/Agents' },
};

function loadContext() {
	return `${MARKER}\n\n${fs.readFileSync(CONTEXT_FILE, 'utf8')}\n\n${MARKER}`;
}

function writeToolFile(toolKey, context) {
	const { files, label } = TOOLS[toolKey];
	for (const file of files) {
		const dir = path.dirname(file);
		if (dir !== '.') fs.mkdirSync(dir, { recursive: true });

		if (fs.existsSync(file)) {
			const existing = fs.readFileSync(file, 'utf8');
			if (existing.includes(MARKER)) {
				const updated = existing.replace(
					new RegExp(`${MARKER}[\\s\\S]*?${MARKER}`),
					context
				);
				fs.writeFileSync(file, updated);
				console.log(`  updated  ${file} (${label})`);
			} else {
				fs.appendFileSync(file, `\n\n${context}\n`);
				console.log(`  appended ${file} (${label})`);
			}
		} else {
			fs.writeFileSync(file, `${context}\n`);
			console.log(`  created  ${file} (${label})`);
		}
	}
}

function detectTools() {
	return Object.entries(TOOLS)
		.filter(([, { files }]) => files.some(f => fs.existsSync(f)))
		.map(([key]) => key);
}

function printHelp() {
	console.log('Usage: npx @trysquare/ai init [--tool <name>]');
	console.log('');
	console.log('Writes trysquare API context to your AI tool config file.');
	console.log('Without --tool, auto-detects existing config files.');
	console.log('');
	console.log('Tools:');
	for (const [key, { files, label }] of Object.entries(TOOLS)) {
		console.log(`  --tool ${key.padEnd(10)} ${label} → ${files.join(', ')}`);
	}
	console.log(`  --tool all        Write all tool files`);
}

const args    = process.argv.slice(2);
const helpIdx = args.indexOf('--help');
if (helpIdx !== -1 || args.includes('-h')) {
	printHelp();
	process.exit(0);
}

const toolIdx = args.indexOf('--tool');
const toolArg = toolIdx !== -1 ? args[toolIdx + 1] : null;

const context = loadContext();

if (toolArg === 'all') {
	console.log('Writing trysquare context for all tools:');
	for (const key of Object.keys(TOOLS)) writeToolFile(key, context);
} else if (toolArg) {
	if (!TOOLS[toolArg]) {
		console.error(`Unknown tool: ${toolArg}`);
		console.error(`Available: ${Object.keys(TOOLS).join(', ')}, all`);
		process.exit(1);
	}
	console.log('Writing trysquare context:');
	writeToolFile(toolArg, context);
} else {
	const detected = detectTools();
	if (detected.length > 0) {
		console.log('Detected AI tool config files — writing trysquare context:');
		for (const key of detected) writeToolFile(key, context);
	} else {
		console.log('No AI tool config detected. Writing AGENTS.md (portable default).');
		console.log('For a specific tool: npx @trysquare/ai init --tool <name>');
		console.log('For all tools:       npx @trysquare/ai init --tool all');
		console.log('');
		writeToolFile('codex', context);
	}
}

console.log('Done.');
