'use strict';

function deriveName(component) {
	if (typeof component === 'function' && component.name) {
		return component.name;
	}
	if (component && typeof component === 'object' && typeof component.name === 'string' && component.name) {
		return component.name;
	}
	return null;
}

function requireComponentName(component, label) {
	if (label) {
		if (typeof label !== 'string' || !label) {
			throw new Error('when() label must be a non-empty string.');
		}
		return label;
	}
	const name = deriveName(component);
	if (!name) {
		throw new Error(
			'when() requires a named function, class, or object with a name property. ' +
			"For arrow functions or ambiguous cases, use when(fn, 'Label')."
		);
	}
	return name;
}

function requireInputName(inputs, method) {
	if (!inputs || typeof inputs !== 'object') {
		throw new Error(`${method}() requires an object with a name property.`);
	}
	if (!inputs.name || typeof inputs.name !== 'string') {
		throw new Error(
			`${method}() requires inputs with a name property. ` +
			'Anonymous inputs produce unreadable documentation.'
		);
	}
}

function requireStubName(stubMap) {
	if (!stubMap || typeof stubMap !== 'object') {
		throw new Error('stubs() requires a stub map object with a name property.');
	}
	if (!stubMap.name || typeof stubMap.name !== 'string') {
		throw new Error(
			'stubs() requires a stub map with a name property. ' +
			'Anonymous stubs produce unreadable documentation.'
		);
	}
}

function requireActionName(userAction, method) {
	if (!userAction || typeof userAction !== 'object') {
		throw new Error(`${method}() requires an object with a name property.`);
	}
	if (!userAction.name || typeof userAction.name !== 'string') {
		throw new Error(
			`${method}() requires a user action with a name property. ` +
			'Anonymous actions produce unreadable documentation.'
		);
	}
}

function requireLifecycleName(lifecycleState) {
	if (!lifecycleState || typeof lifecycleState !== 'object') {
		throw new Error('inState() requires a lifecycle state object with a name property.');
	}
	if (!lifecycleState.name || typeof lifecycleState.name !== 'string') {
		throw new Error('inState() requires a lifecycle state with a name property.');
	}
}

module.exports = {
	deriveName,
	requireComponentName,
	requireInputName,
	requireStubName,
	requireActionName,
	requireLifecycleName,
};
