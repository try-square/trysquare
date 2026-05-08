'use strict';

const { when, makeWhen } = require('./lib/scenario');
const runner = require('./lib/runner');
const { Reporter, ConsoleReporter } = require('./lib/reporter');

function createRunner() {
	const r = new runner.Runner();
	return { runner: r, when: makeWhen(r) };
}

module.exports = { when, runner, createRunner, Reporter, ConsoleReporter };
