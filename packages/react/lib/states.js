'use strict';

// Lifecycle state constants for React components.
// Pass to .inState() on the when() chain.
// Framework extensions (this package) define what these states mean for component rendering.
// Core treats them as documentary only — the name appears in generated documentation.
const states = {
	mounting:  Object.freeze({ name: 'mounting' }),
	mounted:   Object.freeze({ name: 'mounted' }),
	updating:  Object.freeze({ name: 'updating' }),
	unmounted: Object.freeze({ name: 'unmounted' }),
};

module.exports = { states };
