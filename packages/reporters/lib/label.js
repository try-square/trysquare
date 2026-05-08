'use strict';

function givenLabel(test) {
	if (!test.inputs || test.inputs.length === 0) return null;
	return 'Given: ' + test.inputs.map(i => i.name).join(' → ');
}

// Builds the "When" heading from the branch-specific context: stubs, lifecycle, user actions.
// When stubs are absent the lifecycle state serves as the branch differentiator (section 10).
function whenLabel(test) {
	const parts = [];
	if (test.stubs) {
		parts.push(test.stubs.name);
	} else if (test.lifecycleState) {
		parts.push(test.lifecycleState.name);
	}
	if (test.userActions && test.userActions.length > 0) {
		parts.push('user: ' + test.userActions.map(a => a.name).join(', then: '));
	}
	if (parts.length === 0) return null;
	return 'When: ' + parts.join(', ');
}

function resultIcon(result) {
	if (result === 'pass') return '✓';
	if (result === 'fail') return '✗';
	return '-';
}

// Derives rendered spec rows from a test object, merging specResults with the original spec list.
// Specs that never ran (because an earlier spec threw) are shown with result 'skip'.
function resolveSpecRows(test) {
	const resultMap = Object.create(null);
	if (test.specResults) {
		for (const sr of test.specResults) {
			resultMap[sr.name + '|' + sr.category] = sr;
		}
	}

	const mainSpecs = (test.specs || []).map(s => {
		return resultMap[s.name + '|spec'] || { name: s.name, category: 'spec', result: 'skip' };
	});

	const sideEffects = (test.sideEffects || []).map(s => {
		return resultMap[s.name + '|sideEffect'] || { name: s.name, category: 'sideEffect', result: 'skip' };
	});

	return { mainSpecs, sideEffects };
}

function slugify(name) {
	return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

module.exports = { givenLabel, whenLabel, resultIcon, resolveSpecRows, slugify };
