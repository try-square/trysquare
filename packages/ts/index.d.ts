// @trysquare/ts — TypeScript type definitions for @trysquare/core
//
// This is an ambient module declaration file (no top-level imports or exports).
// Including it in a TypeScript compilation provides types for @trysquare/core.
//
// Usage — add to tsconfig.json:
//   {
//     "compilerOptions": {
//       "types": ["@trysquare/ts"]
//     }
//   }
//
// Or reference directly in a project type declaration file:
//   /// <reference types="@trysquare/ts" />

declare module '@trysquare/core' {

	// ── Shared structural types ───────────────────────────────────────────────

	/** Any named object passed to .hasInputs() or .andInputs(). */
	interface NamedInput {
		name: string;
		[key: string]: unknown;
	}

	/**
	 * Stub map passed to .stubs(). Core requires name; framework extensions
	 * define the inject sub-object structure for their DI model.
	 */
	interface StubMap {
		name: string;
		inject?: object;
		[key: string]: unknown;
	}

	/** User action passed to .andUser(). Carries a name for documentation. */
	interface UserAction {
		name: string;
		[key: string]: unknown;
	}

	/**
	 * Lifecycle state passed to .inState().
	 * Framework extensions (react, angular) define the named constants.
	 * Core treats the state as documentary only.
	 */
	interface LifecycleState {
		name: string;
	}

	// ── Spec types ────────────────────────────────────────────────────────────

	/**
	 * A spec provided as a named function.
	 * function.name is used as the documentation label — anonymous functions
	 * are rejected at registration time by the runtime.
	 */
	type SpecFn<O = unknown> = {
		(output: O): void | Promise<void>;
		readonly name: string;
	};

	/** A spec provided as an object with explicit name and assert function. */
	interface SpecObject<O = unknown> {
		name: string;
		assert: (output: O) => void | Promise<void>;
	}

	/** Either form is valid wherever a spec is expected. */
	type Spec<O = unknown> = SpecFn<O> | SpecObject<O>;

	/** Internal normalized spec — both forms are reduced to this after registration. */
	interface NormalizedSpec {
		name: string;
		assert: (output: unknown) => void | Promise<void>;
	}

	// ── Test object model (section 7 of the design document) ─────────────────

	/** Per-spec execution result attached to a TestObject after the runner executes it. */
	interface SpecResult {
		name: string;
		category: 'spec' | 'sideEffect';
		result: 'pass' | 'fail' | 'skip';
		error?: Error;
	}

	/** Options accepted by .assert(). All are optional — each overrides the global runner config. */
	interface AssertOptions {
		timeout?:    number;
		retries?:    number;
		parallel?:   boolean;
		sequential?: boolean;
		skip?:       boolean;
		only?:       boolean;
	}

	/** Options as stored on a TestObject after .assert() — fields have concrete types. */
	interface StoredOptions {
		timeout:    number | null;
		retries:    number | null;
		parallel:   boolean;
		sequential: boolean;
		skip:       boolean;
		only:       boolean;
	}

	type TestType   = 'output' | 'behavioral' | 'interaction';
	type TestResult = 'pass' | 'fail' | 'skip';

	/**
	 * The test object built by .assert() and registered with the runner.
	 * Enriched with result, duration, error, and specResults after execution.
	 */
	interface TestObject {
		// Scenario identity
		component:      string;
		componentFn:    Function;
		lifecycleState: LifecycleState | null;
		inputs:         NamedInput[];
		stubs:          StubMap | null;
		userActions:    UserAction[];
		// Contract
		type:           TestType;
		specs:          NormalizedSpec[];
		sideEffects:    NormalizedSpec[];
		// Focus / ignore
		focused:        boolean;
		ignored:        boolean;
		// Execution options
		_baseId:        string | null;
		options:        StoredOptions;
		// Added by the runner after execution
		result:         TestResult | null;
		duration:       number | null;
		error:          Error | null;
		specResults:    SpecResult[];
		/** Internal: computed output from component execution. */
		_output?:       unknown;
	}

	// ── Suite (reporter events) ───────────────────────────────────────────────

	/** Snapshot passed to reporter onSuiteStart and onSuiteEnd events. */
	interface Suite {
		tests:      TestObject[];
		startTime:  number;
		endTime?:   number;
		duration?:  number;
		passed:     number;
		failed:     number;
		skipped:    number;
	}

	// ── Fluent chain ──────────────────────────────────────────────────────────

	/**
	 * The output phase — .sideEffects() and .assert() are available.
	 * Reached via .expect.output(). Side effects registered here run after
	 * output specs; the component is always called for output-type tests.
	 */
	interface TerminationChain<O = unknown> {
		sideEffects(...specs: Spec<O>[]): TerminationChain<O>;
		assert(options?: AssertOptions): TestObject;
	}

	/**
	 * The behavioral phase — .behaviors(), .sideEffects(), and .assert().
	 * Reached via .expect.behaviors() or .expect.sideEffects().
	 */
	interface BehaviorChain<O = unknown> {
		behaviors(...specs: Spec<O>[]): BehaviorChain<O>;
		sideEffects(...specs: Spec<O>[]): BehaviorChain<O>;
		assert(options?: AssertOptions): TestObject;
	}

	/**
	 * The expectation phase — accessed via chain.expect.
	 * Splits the chain into setup (before) and contract (after).
	 */
	interface ExpectChain<O = unknown> {
		output(...specs: Spec<O>[]): TerminationChain<O>;
		behaviors(...specs: Spec<O>[]): BehaviorChain<O>;
		sideEffects(...specs: Spec<O>[]): BehaviorChain<O>;
	}

	/**
	 * The setup phase of the chain returned by when() and all setup methods.
	 * The runtime does not enforce a strict calling order — all setup methods
	 * are available at any point before .expect.
	 *
	 * O is the output type of the component under test, inferred from the
	 * component function's return type when possible.
	 */
	interface Chain<O = unknown> {
		focus():                         Chain<O>;
		ignore():                        Chain<O>;
		inState(state: LifecycleState):  Chain<O>;
		isInitialized():                 Chain<O>;
		hasInputs(inputs: NamedInput):   Chain<O>;
		andInputs(inputs: NamedInput):   Chain<O>;
		stubs(stubMap: StubMap):         Chain<O>;
		andUser(action: UserAction):     Chain<O>;
		readonly expect:                 ExpectChain<O>;
	}

	// ── Runner ────────────────────────────────────────────────────────────────

	/** Global runner configuration — all fields optional, merged over defaults. */
	interface RunnerConfig {
		/** Execution mode. Default: 'sequential'. */
		execution?:         'parallel' | 'sequential' | 'batch' | 'immediate';
		/** Batch size for 'batch' mode. Default: 10. */
		batchSize?:         number;
		/** Global test timeout in ms. Default: 5000. */
		timeout?:           number;
		/** Global retry count. Default: 0. */
		retries?:           number;
		/** Behaviour when focused tests are present in CI. Default: 'error'. */
		focusInCIBehavior?: 'warn' | 'error';
	}

	/**
	 * Duck-typed reporter interface — implement any subset of these methods.
	 * The runner calls all registered reporters for each lifecycle event.
	 * Errors thrown inside reporter methods are caught and logged; they do
	 * not abort test execution.
	 */
	interface ReporterLike {
		onSuiteStart?(suite: Suite):     void;
		onTestStart?(test: TestObject):  void;
		onTestPass?(test: TestObject):   void;
		onTestFail?(test: TestObject):   void;
		onTestSkip?(test: TestObject):   void;
		onSuiteEnd?(suite: Suite):       void;
	}

	/** Constructor for the Runner class. Accessible via runner.Runner. */
	interface RunnerConstructor {
		new(): RunnerInstance;
	}

	/** The runner singleton exported from @trysquare/core. */
	interface RunnerInstance {
		/** The Runner class constructor — use to create isolated runner instances. */
		Runner: RunnerConstructor;
		/** Merge config over the current runner configuration. */
		configure(config: RunnerConfig): this;
		/** Register a reporter. Called for every test lifecycle event. */
		register(reporter: ReporterLike): this;
		/** Set the execution mode directly. Prefer configure({ execution }) instead. */
		setMode(mode: string): this;
		/** Execute all registered tests and return the completed suite. */
		run(): Promise<Suite>;
		/** Clear registered tests, reporters, and reset config to defaults. */
		reset(): void;
		/** @internal Called by .assert() to register a test object. */
		_addTest(test: TestObject): void | Promise<void>;
		/** @internal Overridable by framework extensions (react, angular). */
		_executeTest(test: TestObject): Promise<void>;
		/** @internal Runs all specs against the component output. */
		_executeSpecs(test: TestObject, output: unknown): Promise<void>;
		/** @internal Registered test objects. */
		_tests: TestObject[];
		/** @internal Registered reporters. */
		_reporters: ReporterLike[];
		/** @internal Active configuration. */
		_config: Required<RunnerConfig>;
	}

	// ── Public API ────────────────────────────────────────────────────────────

	/**
	 * Begin a scenario chain for the component under test.
	 *
	 * The output type O is inferred from the component's return type when the
	 * component is a typed function. O flows through the chain to spec functions,
	 * providing type-safe assertions.
	 *
	 * @param component - Named function, class, or framework component under test.
	 *   Anonymous functions are rejected at runtime by the naming enforcement rules.
	 * @param label - Optional explicit label. Use for arrow functions or when the
	 *   auto-derived name is not descriptive enough.
	 */
	function when<O = unknown>(
		component: ((...args: any[]) => O) | Function,
		label?: string
	): Chain<O>;

	/** The global runner singleton. All .assert() calls register tests here. */
	const runner: RunnerInstance;

	/**
	 * Base Reporter class. Extend to create custom reporters.
	 * All methods are no-ops by default — override only the events you need.
	 */
	class Reporter implements ReporterLike {
		onSuiteStart(suite: Suite):     void;
		onTestStart(test: TestObject):  void;
		onTestPass(test: TestObject):   void;
		onTestFail(test: TestObject):   void;
		onTestSkip(test: TestObject):   void;
		onSuiteEnd(suite: Suite):       void;
	}

	/** Default reporter for local development. Prints pass/fail to stdout. */
	class ConsoleReporter extends Reporter {}
}

declare module '@trysquare/matchers' {

	// ── Shared types ──────────────────────────────────────────────────────────

	/**
	 * A matcher — structurally compatible with SpecObject from @trysquare/core,
	 * so matchers can be passed directly to .output(), .behaviors(), etc.
	 */
	interface Matcher<O = unknown> {
		name:   string;
		assert: (output: O) => void;
	}

	/** Named or anonymous selector applied to the component output before asserting. */
	type Selector<O = any, R = any> = (output: O) => R;

	// ── Spy ───────────────────────────────────────────────────────────────────

	/**
	 * A spy function created by spy(). Callable, records every invocation,
	 * and optionally delegates to a provided implementation.
	 */
	interface Spy<T = unknown> {
		(...args: any[]): T;
		readonly name:    string;
		_calls:           any[][];
		_callSeqs:        number[];
		_isSpy:           true;
		reset():          void;
	}

	/** Options accepted by functionCall(). */
	interface FunctionCallOptions {
		/** Exact number of times the spy must have been called. */
		times?:     number;
		/** At least one call must have been made with these arguments (deep equality). */
		arguments?: any[];
	}

	// ── Spy creator ───────────────────────────────────────────────────────────

	/**
	 * Create a named spy. Pass an optional implementation to control return
	 * values. Use with returns() for per-call sequencing.
	 */
	function spy<T = undefined>(name: string, implementation?: (...args: any[]) => T): Spy<T>;

	/**
	 * Return values in sequence across successive calls. Sticks on the last
	 * value after the list is exhausted. Designed as the second argument to spy().
	 *
	 * @example
	 * const mockFetch = spy('fetches user', returns(null, null, { id: 1 }));
	 */
	function returns<T>(first: T, ...rest: T[]): (...args: any[]) => T;

	// ── Unified spy matcher ───────────────────────────────────────────────────

	/** Unified call assertion — checks count, arguments, or both. */
	function functionCall(spy: Spy, options?: FunctionCallOptions): Matcher<unknown>;

	// ── Individual spy matchers ───────────────────────────────────────────────

	/** Assert the spy was called at least once. */
	function wasCalled(spy: Spy): Matcher<unknown>;
	/** Assert the spy was called exactly once. */
	function wasCalledOnce(spy: Spy): Matcher<unknown>;
	/** Assert the spy was called exactly n times. */
	function wasCalledTimes(spy: Spy, n: number): Matcher<unknown>;
	/** Assert at least one call matched expectedArgs (deep equality). */
	function wasCalledWith(spy: Spy, expectedArgs: any[]): Matcher<unknown>;
	/** Assert the spy was never called. */
	function wasNotCalled(spy: Spy): Matcher<unknown>;

	// ── Call-ordering matchers ────────────────────────────────────────────────

	/** Assert spyA's first call happened before spyB's first call. */
	function wasCalledBefore(spyA: Spy, spyB: Spy): Matcher<unknown>;
	/** Assert spyA's first call happened after spyB's first call. */
	function wasCalledAfter(spyA: Spy, spyB: Spy): Matcher<unknown>;
	/** Assert spyFn was called before all of the other spies. */
	function wasCalledFirst(spyFn: Spy, ...others: Spy[]): Matcher<unknown>;
	/** Assert spyFn was called after all of the other spies. */
	function wasCalledLast(spyFn: Spy, ...others: Spy[]): Matcher<unknown>;

	// ── Equality matchers ─────────────────────────────────────────────────────

	/** Assert output === expected (strict). Optional selector applied first. */
	function equals<O>(expected: O, selector?: Selector): Matcher<unknown>;
	/** Assert output deep-equals expected. Optional selector applied first. */
	function deepEquals<O>(expected: O, selector?: Selector): Matcher<unknown>;

	// ── Structure matchers ────────────────────────────────────────────────────

	/** Assert a string or array contains item. Optional selector applied first. */
	function includes(item: unknown, selector?: Selector): Matcher<unknown>;
	/** Assert the output object has the named property. Optional selector applied first. */
	function hasProperty(key: string, selector?: Selector): Matcher<unknown>;

	// ── Type matchers ─────────────────────────────────────────────────────────

	/** Assert typeof output === typeName. Optional selector applied first. */
	function isType(typeName: string, selector?: Selector): Matcher<unknown>;
	/** Assert output === null. Optional selector applied first. */
	function isNull(selector?: Selector): Matcher<unknown>;
	/** Assert output !== undefined. Optional selector applied first. */
	function isDefined(selector?: Selector): Matcher<unknown>;

	// ── Pattern matchers ──────────────────────────────────────────────────────

	/** Assert a string output matches the regex. Optional selector applied first. */
	function matches(regex: RegExp, selector?: Selector): Matcher<unknown>;
}

declare module '@trysquare/factories' {

	// ── Structural types (compatible with @trysquare/core) ────────────────────

	/** Named input object — compatible with NamedInput from @trysquare/core. */
	interface FactoryInput {
		name: string;
		[key: string]: unknown;
	}

	/** Named stub map — compatible with StubMap from @trysquare/core. */
	interface FactoryStub {
		name:    string;
		inject?: object;
		[key: string]: unknown;
	}

	/** Named user action — compatible with UserAction from @trysquare/core. */
	interface FactoryAction {
		name:    string;
		execute: (...args: any[]) => unknown;
		[key: string]: unknown;
	}

	/** A factory create function returned by factory(). */
	type CreateFn = (name: string, overrides?: Record<string, unknown>) => FactoryInput;

	// ── Factory functions ─────────────────────────────────────────────────────

	/**
	 * Build a named input object. fields are spread in; name always wins.
	 * @example input('valid user', { id: 1, role: 'admin' })
	 */
	function input(name: string, fields?: Record<string, unknown>): FactoryInput;

	/**
	 * Build a named stub map for use with .stubs().
	 * @example stub('mock http client', { get: () => ({ status: 200 }) })
	 */
	function stub(name: string, inject?: object): FactoryStub;

	/**
	 * Build a named user action for use with .andUser().
	 * @example action('clicks submit', (el) => el.click())
	 */
	function action(name: string, execute: (...args: any[]) => unknown): FactoryAction;

	/**
	 * Returns a create function that merges defaults with per-call overrides.
	 * Use to stamp out variants of a base input.
	 *
	 * @example
	 * const makeUser = factory({ role: 'viewer', active: true });
	 * const admin = makeUser('admin user', { role: 'admin' });
	 */
	function factory(defaults?: Record<string, unknown>): CreateFn;

	/**
	 * Returns a counter function that increments by step on each call.
	 * Useful for generating unique IDs in test inputs.
	 *
	 * @example
	 * const nextId = sequence(1);
	 * nextId() // 1, nextId() // 2, ...
	 */
	function sequence(start?: number, step?: number): () => number;
}
