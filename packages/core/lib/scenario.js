'use strict';

const { nextId } = require('./id');
const {
	requireComponentName,
	requireInputName,
	requireStubName,
	requireActionName,
	requireLifecycleName,
} = require('./validate');
const { normalizeSpecs } = require('./spec');
const singletonRunner = require('./runner');

// Returns a `when` function bound to the given runner instance.
// Used by createRunner() to produce isolated runner+when pairs for testing.
function makeWhen(targetRunner) {

	function buildChain(state) {
		const chain = Object.create(null);

		chain.focus = function focus() {
			return buildChain({ ...state, focused: true });
		};

		chain.ignore = function ignore() {
			return buildChain({ ...state, ignored: true });
		};

		chain.inState = function inState(lifecycleState) {
			requireLifecycleName(lifecycleState);
			return buildChain({ ...state, lifecycleState });
		};

		chain.isInitialized = function isInitialized() {
			return buildChain({ ...state, lifecycleState: { name: 'initialized' } });
		};

		chain.hasInputs = function hasInputs(inputs) {
			requireInputName(inputs, 'hasInputs');
			const baseId = state.baseId || nextId();
			return buildChain({ ...state, inputs: [inputs], baseId });
		};

		chain.andInputs = function andInputs(inputs) {
			requireInputName(inputs, 'andInputs');
			return buildChain({ ...state, inputs: [...state.inputs, inputs] });
		};

		chain.stubs = function stubs(stubMap) {
			requireStubName(stubMap);
			return buildChain({ ...state, stubs: stubMap });
		};

		chain.andUser = function andUser(userAction) {
			requireActionName(userAction, 'andUser');
			return buildChain({ ...state, userActions: [...state.userActions, userAction] });
		};

		Object.defineProperty(chain, 'expect', {
			get() { return buildExpectation(state); },
			enumerable: true,
		});

		return Object.freeze(chain);
	}

	function buildExpectation(state) {
		const expectation = Object.create(null);

		expectation.output = function output(...specs) {
			const normalized = normalizeSpecs(specs);
			return buildTermination({ ...state, type: 'output', specs: normalized, sideEffects: [] });
		};

		expectation.behaviors = function behaviors(...specs) {
			const normalized = normalizeSpecs(specs);
			const type = state.userActions.length > 0 ? 'interaction' : 'behavioral';
			return buildBehaviorChain({ ...state, type, specs: normalized, sideEffects: [] });
		};

		expectation.sideEffects = function sideEffects(...specs) {
			const normalized = normalizeSpecs(specs);
			const type = state.userActions.length > 0 ? 'interaction' : 'behavioral';
			return buildBehaviorChain({ ...state, type, specs: [], sideEffects: normalized });
		};

		return Object.freeze(expectation);
	}

	function buildBehaviorChain(state) {
		const chain = Object.create(null);

		chain.behaviors = function behaviors(...specs) {
			const normalized = normalizeSpecs(specs);
			return buildBehaviorChain({ ...state, specs: [...state.specs, ...normalized] });
		};

		chain.sideEffects = function sideEffects(...specs) {
			const normalized = normalizeSpecs(specs);
			return buildBehaviorChain({ ...state, sideEffects: [...state.sideEffects, ...normalized] });
		};

		chain.assert = function assert(options) {
			return registerTest(state, options);
		};

		return Object.freeze(chain);
	}

	function buildTermination(state) {
		const chain = Object.create(null);

		chain.sideEffects = function sideEffects(...specs) {
			const normalized = normalizeSpecs(specs);
			return buildTermination({ ...state, sideEffects: [...state.sideEffects, ...normalized] });
		};

		chain.assert = function assert(options) {
			return registerTest(state, options);
		};

		return Object.freeze(chain);
	}

	function registerTest(state, options) {
		const opts = options || {};
		const testObj = {
			component: state.componentName,
			componentFn: state.componentFn,
			lifecycleState: state.lifecycleState,
			inputs: state.inputs,
			stubs: state.stubs,
			userActions: state.userActions,
			type: state.type,
			specs: state.specs,
			sideEffects: state.sideEffects,
			focused: state.focused || opts.only || false,
			ignored: state.ignored || opts.skip || false,
			_baseId: state.baseId,
			options: {
				timeout: opts.timeout || null,
				retries: opts.retries != null ? opts.retries : null,
				parallel: opts.parallel || false,
				sequential: opts.sequential || false,
				skip: opts.skip || false,
				only: opts.only || false,
			},
			result: null,
			duration: null,
			error: null,
			specResults: [],
		};

		targetRunner._addTest(testObj);
		return testObj;
	}

	function when(component, label) {
		const componentName = requireComponentName(component, label);
		const state = {
			componentFn: component,
			componentName,
			baseId: null,
			focused: false,
			ignored: false,
			lifecycleState: null,
			inputs: [],
			stubs: null,
			userActions: [],
		};
		return buildChain(state);
	}

	return when;
}

const when = makeWhen(singletonRunner);

module.exports = { when, makeWhen };
