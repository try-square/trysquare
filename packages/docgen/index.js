'use strict';

const { DocumentGenerator } = require('./lib/document-generator');
const { buildDocs }         = require('./lib/doc-builder');
const { renderMarkdown }    = require('./lib/markdown-renderer');
const { renderHtml }        = require('./lib/html-renderer');

module.exports = { DocumentGenerator, buildDocs, renderMarkdown, renderHtml };
