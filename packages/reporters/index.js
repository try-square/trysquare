'use strict';

const { MarkdownReporter } = require('./lib/markdown-reporter');
const { HTMLReporter } = require('./lib/html-reporter');
const { PDFReporter } = require('./lib/pdf-reporter');
const { JUnitReporter } = require('./lib/junit-reporter');
const { Reporter, ConsoleReporter } = require('@trysquare/core');

module.exports = {
	MarkdownReporter,
	HTMLReporter,
	PDFReporter,
	JUnitReporter,
	Reporter,
	ConsoleReporter,
};
