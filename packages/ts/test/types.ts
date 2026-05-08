// Type-check tests for @trysquare/ts
// Verified via `tsc --noEmit` — no runtime execution.

import { when, runner, Reporter, ConsoleReporter } from '@trysquare/core';
import type {
	Chain,
	BehaviorChain,
	TerminationChain,
	ExpectChain,
	Spec,
	SpecFn,
	SpecObject,
	TestObject,
	Suite,
	AssertOptions,
	StoredOptions,
	NamedInput,
	StubMap,
	UserAction,
	LifecycleState,
	RunnerConfig,
	ReporterLike,
	RunnerInstance,
	NormalizedSpec,
	SpecResult,
} from '@trysquare/core';

// ── Typed component inference ─────────────────────────────────────────────────

function greet(input: { name: string; greeting: string }): string {
	return `${input.greeting}, ${input.name}`;
}

// O is inferred as string from greet's return type
const chain: Chain<string> = when(greet);

// ── Chain setup methods ───────────────────────────────────────────────────────

const state: LifecycleState = { name: 'mounted' };
const input: NamedInput = { name: 'basic user', userId: '42' };
const stubs: StubMap = { name: 'mock http', inject: {} };
const action: UserAction = { name: 'clicks button' };

const c1: Chain<string> = when(greet).focus();
const c2: Chain<string> = when(greet).ignore();
const c3: Chain<string> = when(greet).inState(state);
const c4: Chain<string> = when(greet).isInitialized();
const c5: Chain<string> = when(greet).hasInputs(input);
const c6: Chain<string> = when(greet).andInputs(input);
const c7: Chain<string> = when(greet).stubs(stubs);
const c8: Chain<string> = when(greet).andUser(action);

// Chaining is fluent
const chained: Chain<string> = when(greet)
	.focus()
	.inState(state)
	.hasInputs(input)
	.andInputs(input)
	.stubs(stubs)
	.andUser(action);

// ── expect splits the chain ───────────────────────────────────────────────────

const expectChain: ExpectChain<string> = when(greet).expect;

// ── TerminationChain via .expect.output() ────────────────────────────────────

function isHello(output: string): void {
	if (!output.startsWith('Hello')) throw new Error('not a greeting');
}

const term: TerminationChain<string> = when(greet).hasInputs(input).expect.output(isHello);
const testObj: TestObject = term.assert();
const testObjWithOpts: TestObject = term.assert({ timeout: 3000, retries: 2, skip: false });

// .sideEffects() on TerminationChain returns TerminationChain<O> — type-safe chaining
const termWithSide: TerminationChain<string> = when(greet).hasInputs(input).expect.output(isHello).sideEffects(checksLength);
const termChained: TerminationChain<string> = when(greet).hasInputs(input).expect.output().sideEffects(isHello).sideEffects(checksLength);
const _t3: TestObject = termWithSide.assert();

// ── BehaviorChain via .expect.behaviors() ────────────────────────────────────

function checksLength(output: string): void {
	if (output.length === 0) throw new Error('empty');
}

const behav: BehaviorChain<string> = when(greet).hasInputs(input).expect.behaviors(isHello);
const behav2: BehaviorChain<string> = behav.behaviors(checksLength);
const behav3: BehaviorChain<string> = behav.sideEffects(isHello);
const testObj2: TestObject = behav.assert();

// ── BehaviorChain via .expect.sideEffects() ──────────────────────────────────

const se: BehaviorChain<string> = when(greet).hasInputs(input).expect.sideEffects(isHello);

// ── Spec forms ────────────────────────────────────────────────────────────────

const specFn: SpecFn<string> = function isNonEmpty(output: string): void {
	if (output.length === 0) throw new Error('empty');
};

const specObj: SpecObject<string> = {
	name: 'is non-empty',
	assert: (output: string): void => {
		if (output.length === 0) throw new Error('empty');
	},
};

const spec1: Spec<string> = specFn;
const spec2: Spec<string> = specObj;

when(greet).hasInputs(input).expect.output(specFn, specObj);

// ── Async specs ───────────────────────────────────────────────────────────────

const asyncSpec: SpecFn<string> = async function asyncCheck(output: string): Promise<void> {
	await Promise.resolve();
	if (!output) throw new Error('falsy');
};

when(greet).hasInputs(input).expect.output(asyncSpec);

// ── Generic when() without type inference ────────────────────────────────────

function untyped(x: unknown) { return x; }
const untypedChain: Chain<unknown> = when(untyped);

// ── Optional label parameter ─────────────────────────────────────────────────

const labeled: Chain<string> = when(greet, 'custom label');

// ── TestObject shape ─────────────────────────────────────────────────────────

const obj: TestObject = testObj;
const _comp:   string          = obj.component;
const _compFn: Function        = obj.componentFn;
const _lc:     LifecycleState | null = obj.lifecycleState;
const _inputs: NamedInput[]    = obj.inputs;
const _stubs:  StubMap | null  = obj.stubs;
const _ua:     UserAction[]    = obj.userActions;
const _specs:  NormalizedSpec[] = obj.specs;
const _se2:    NormalizedSpec[] = obj.sideEffects;
const _foc:    boolean         = obj.focused;
const _ign:    boolean         = obj.ignored;
const _bid:    string | null   = obj._baseId;
const _opts:   StoredOptions   = obj.options;
const _res:    'pass' | 'fail' | 'skip' | null = obj.result;
const _dur:    number | null   = obj.duration;
const _err:    Error | null    = obj.error;
const _sr:     SpecResult[]    = obj.specResults;

// StoredOptions has concrete types (not undefined)
const _to:  number | null = obj.options.timeout;
const _ret: number | null = obj.options.retries;
const _par: boolean       = obj.options.parallel;
const _seq: boolean       = obj.options.sequential;
const _sk:  boolean       = obj.options.skip;
const _on:  boolean       = obj.options.only;

// ── SpecResult shape ─────────────────────────────────────────────────────────

const sr: SpecResult = obj.specResults[0];
if (sr) {
	const _srName: string = sr.name;
	const _srCat:  'spec' | 'sideEffect' = sr.category;
	const _srRes:  'pass' | 'fail' | 'skip' = sr.result;
	const _srErr:  Error | undefined = sr.error;
}

// ── NormalizedSpec shape ──────────────────────────────────────────────────────

const ns: NormalizedSpec = obj.specs[0];
if (ns) {
	const _nsName: string = ns.name;
	const _nsAssert: (output: unknown) => void | Promise<void> = ns.assert;
}

// ── Suite shape ───────────────────────────────────────────────────────────────

const fakeSuite: Suite = {
	tests:     [],
	startTime: Date.now(),
	passed:    0,
	failed:    0,
	skipped:   0,
};
const _et: number | undefined = fakeSuite.endTime;
const _ed: number | undefined = fakeSuite.duration;

// ── AssertOptions — all optional ──────────────────────────────────────────────

const opts: AssertOptions = {};
const opts2: AssertOptions = { timeout: 5000, retries: 3, parallel: true, sequential: false, skip: true, only: false };

// ── RunnerConfig ──────────────────────────────────────────────────────────────

const cfg: RunnerConfig = {};
const cfg2: RunnerConfig = {
	execution:         'parallel',
	batchSize:         5,
	timeout:           10000,
	retries:           1,
	focusInCIBehavior: 'warn',
};

// ── Runner API ────────────────────────────────────────────────────────────────

const r: RunnerInstance = runner;
runner.configure({ execution: 'sequential' });
runner.register({ onTestPass(test: TestObject) { void test; } });
runner.setMode('parallel');
runner.reset();
runner._addTest(testObj);

// runner.run() returns Promise<Suite>
const suitePromise: Promise<Suite> = runner.run();

// runner.Runner is a constructor
const freshRunner: RunnerInstance = new runner.Runner();

// ── ReporterLike duck typing ──────────────────────────────────────────────────

const partial: ReporterLike = {
	onTestPass(test: TestObject) { void test; },
};
runner.register(partial);

const empty: ReporterLike = {};
runner.register(empty);

// ── Reporter base class ───────────────────────────────────────────────────────

class MyReporter extends Reporter {
	onTestPass(test: TestObject): void {
		void test;
	}
	onSuiteEnd(suite: Suite): void {
		void suite;
	}
}

const myReporter: ReporterLike = new MyReporter();
runner.register(myReporter);

// ConsoleReporter extends Reporter
const cr: Reporter = new ConsoleReporter();
runner.register(cr);

// ── Negative type tests ───────────────────────────────────────────────────────

// Spec with wrong output type should not be assignable to Spec<string>
// @ts-expect-error — number spec not compatible with string chain
const badSpec: Spec<string> = function wrongType(output: number): void { void output; };

// NamedInput requires name property
// @ts-expect-error — missing name
const badInput: NamedInput = { userId: '42' };

// StubMap requires name property
// @ts-expect-error — missing name
const badStub: StubMap = { inject: {} };

// UserAction requires name property
// @ts-expect-error — missing name
const badAction: UserAction = { clicked: true };

// AssertOptions does not accept unknown keys with known types at strict level
// (index signature absent — extra props are an error in object literals)
// @ts-expect-error — unknown option
const badOpts: AssertOptions = { timeout: 1000, unknown: true };

// runner.configure requires RunnerConfig shape
// @ts-expect-error — invalid execution value
runner.configure({ execution: 'turbo' });

// ══ @trysquare/matchers ═══════════════════════════════════════════════════════

import {
	spy, returns,
	functionCall, wasCalled, wasCalledOnce, wasCalledTimes, wasCalledWith, wasNotCalled,
	wasCalledBefore, wasCalledAfter, wasCalledFirst, wasCalledLast,
	equals, deepEquals, includes, hasProperty,
	isType, isNull, isDefined,
	matches,
} from '@trysquare/matchers';
import type { Spy, Matcher, FunctionCallOptions, Selector } from '@trysquare/matchers';

// ── spy() ─────────────────────────────────────────────────────────────────────

const mockSave: Spy = spy('saves record');
const mockFetch: Spy<{ id: number }> = spy('fetches user', () => ({ id: 1 }));

// Spy is callable
mockSave('arg1', 2);
const fetchResult: { id: number } = mockFetch();

// Spy metadata
const _spyCalls:    any[][]  = mockSave._calls;
const _spySeqs:     number[] = mockSave._callSeqs;
const _spyFlag:     true     = mockSave._isSpy;
const _spyName:     string   = mockSave.name;
mockSave.reset();

// returns() produces a typed implementation function
const retFn: ((...args: any[]) => number) = returns(1, 2, 3);

// ── Matcher shape ─────────────────────────────────────────────────────────────

const m: Matcher = wasCalled(mockSave);
const _mName:   string                      = m.name;
const _mAssert: (output: unknown) => void   = m.assert;

// ── Spy matchers ──────────────────────────────────────────────────────────────

const _fc:    Matcher = functionCall(mockSave);
const _fco:   Matcher = functionCall(mockSave, { times: 2, arguments: ['x'] });
const _wc:    Matcher = wasCalled(mockSave);
const _wco:   Matcher = wasCalledOnce(mockSave);
const _wct:   Matcher = wasCalledTimes(mockSave, 3);
const _wcw:   Matcher = wasCalledWith(mockSave, ['arg1']);
const _wnc:   Matcher = wasNotCalled(mockSave);
const _wcb:   Matcher = wasCalledBefore(mockSave, mockFetch);
const _wca:   Matcher = wasCalledAfter(mockSave, mockFetch);
const _wfst:  Matcher = wasCalledFirst(mockSave, mockFetch);
const _wlst:  Matcher = wasCalledLast(mockSave, mockFetch);

// wasCalledFirst / wasCalledLast accept multiple others
const _wf3:   Matcher = wasCalledFirst(mockSave, mockFetch, mockSave);
const _wl3:   Matcher = wasCalledLast(mockSave, mockFetch, mockSave);

// Matchers are usable as specs on the chain (structural compatibility)
when(greet).hasInputs(input).expect.output(wasCalled(mockSave));
when(greet).hasInputs(input).expect.output(equals('hello', o => o));

// ── Equality matchers ─────────────────────────────────────────────────────────

const _eq:   Matcher = equals('hello');
const _deq:  Matcher = deepEquals({ id: 1 });
const _eqSel: Matcher = equals(42, (o: unknown) => (o as any).value);

// ── Structure matchers ────────────────────────────────────────────────────────

const _inc:  Matcher = includes('foo');
const _hp:   Matcher = hasProperty('id');

// ── Type matchers ─────────────────────────────────────────────────────────────

const _it:   Matcher = isType('string');
const _in:   Matcher = isNull();
const _id:   Matcher = isDefined();

// ── Pattern matchers ──────────────────────────────────────────────────────────

const _mt:   Matcher = matches(/^\d+$/);

// ── Selector type ─────────────────────────────────────────────────────────────

const sel: Selector<{ value: number }, number> = o => o.value;
const _eqWithSel: Matcher = equals(42, sel);

// ── Negative type tests ───────────────────────────────────────────────────────

// spy() requires a string name — passing wrong type should error
// @ts-expect-error — name must be a string
spy(42);

// returns() with no arguments should error
// @ts-expect-error — at least one value required
returns();

// functionCall() requires a Spy, not a plain function
// @ts-expect-error — plain function is not a Spy
functionCall(() => {});

// wasCalledTimes() requires a number second argument
// @ts-expect-error — string is not a number
wasCalledTimes(mockSave, 'three');

// ══ @trysquare/factories ══════════════════════════════════════════════════════

import { input as mkInput, stub as mkStub, action as mkAction, factory, sequence } from '@trysquare/factories';
import type { FactoryInput, FactoryStub, FactoryAction, CreateFn } from '@trysquare/factories';

// ── input() ───────────────────────────────────────────────────────────────────

const fi: FactoryInput = mkInput('valid user', { id: 1, role: 'admin' });
const _fiName: string  = fi.name;

// FactoryInput is structurally compatible with NamedInput from core
const _asNamedInput: NamedInput = fi;

// ── stub() ────────────────────────────────────────────────────────────────────

const fs: FactoryStub = mkStub('mock http', { get: () => {} });
const _fsName:   string        = fs.name;
const _fsInject: object | undefined = fs.inject;

// FactoryStub is structurally compatible with StubMap from core
const _asStubMap: StubMap = fs;

// ── action() ─────────────────────────────────────────────────────────────────

const fa: FactoryAction = mkAction('clicks submit', (el: unknown) => void el);
const _faName:    string                         = fa.name;
const _faExecute: (...args: any[]) => unknown    = fa.execute;

// FactoryAction is structurally compatible with UserAction from core
const _asUserAction: UserAction = fa;

// ── factory() ────────────────────────────────────────────────────────────────

const makeUser: CreateFn = factory({ role: 'viewer', active: true });
const adminUser: FactoryInput = makeUser('admin user', { role: 'admin' });
const _adminName: string = adminUser.name;

// factory() without defaults is valid
const makeEmpty: CreateFn = factory();
const emptyInput: FactoryInput = makeEmpty('bare input');

// ── sequence() ───────────────────────────────────────────────────────────────

const nextId: () => number = sequence(1);
const _id1: number = nextId();
const _id2: number = nextId();

const nextEven: () => number = sequence(0, 2);
const nextDefault: () => number = sequence();

// ── Negative type tests ───────────────────────────────────────────────────────

// input() name must be a string
// @ts-expect-error — name must be a string
mkInput(42);

// action() execute must be a function
// @ts-expect-error — number is not a function
mkAction('clicks', 42);

// sequence() returns a function returning number — can't assign to string
// @ts-expect-error — number is not string
const _badSeq: () => string = sequence();
