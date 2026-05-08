'use strict';

// Groups a flat array of test objects into a hierarchy for rendering.
// Returns: [ { component, baseGroups: [ { baseId, tests: [...] } ] } ]
// Preserves registration order within each level.
function groupTests(tests) {
	const componentOrder = [];
	const componentMap = Object.create(null);
	let soloCounter = 0;

	for (const test of tests) {
		const comp = test.component;
		if (!componentMap[comp]) {
			componentMap[comp] = { component: comp, baseGroups: [], baseGroupMap: Object.create(null) };
			componentOrder.push(comp);
		}
		const compEntry = componentMap[comp];

		// null _baseId means the test was registered without .hasInputs() — treat as solo group.
		const baseKey = test._baseId != null ? String(test._baseId) : `_solo_${soloCounter++}`;

		if (!compEntry.baseGroupMap[baseKey]) {
			const group = { baseId: baseKey, tests: [] };
			compEntry.baseGroupMap[baseKey] = group;
			compEntry.baseGroups.push(group);
		}
		compEntry.baseGroupMap[baseKey].tests.push(test);
	}

	return componentOrder.map(comp => componentMap[comp]);
}

module.exports = { groupTests };
