'use strict';

const assert = require('node:assert/strict');
const { when, createRunner } = require('@trysquare/core');
const { spy, returns, functionCall, wasCalled, wasCalledOnce, wasCalledTimes, wasCalledWith, wasNotCalled, wasCalledBefore, wasCalledAfter, wasCalledFirst, wasCalledLast } = require('./spy');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

// ── spy() creator ─────────────────────────────────────────────────────────────

function spyCreator(_) {
	const plain    = spy('saves record');
	const withImpl = spy('fetches user', () => ({ id: 1 }));
	const doubles  = spy('doubles', n => n * 2);
	plain('a', 1);
	plain('b', 2);
	const beforeReset = plain._calls.length;
	plain.reset();
	return {
		isFunction:   typeof plain === 'function',
		name:         plain.name,
		callsLength:  beforeReset,
		firstCall:    [['a', 1]],
		isSpy:        plain._isSpy,
		afterReset:   plain._calls.length,
		defaultReturn:spy('no-op')(),
		implReturn:   withImpl(),
		implArgs:     doubles(5),
		emptyCall:    spy('pings')._calls.length === 0 && (spy('pings')(), true),
	};
}

function spyCreatorBehavior(r) {
	assert.strictEqual(r.isFunction,   true);
	assert.strictEqual(r.name,         'saves record');
	assert.strictEqual(r.callsLength,  2);
	assert.deepStrictEqual(r.firstCall, [['a', 1]]);
	assert.strictEqual(r.isSpy,        true);
	assert.strictEqual(r.afterReset,   0);
	assert.strictEqual(r.defaultReturn,undefined);
	assert.deepStrictEqual(r.implReturn, { id: 1 });
	assert.strictEqual(r.implArgs,     10);
}

when(spyCreator)
	.hasInputs({ name: 'spy creation and basic usage', value: null })
	.expect.output(spyCreatorBehavior)
	.assert();

function spyValidation(_) {
	return {
		emptyName:     catching(() => spy('')),
		nullName:      catching(() => spy(null)),
		numberName:    catching(() => spy(42)),
		stringImpl:    catching(() => spy('fn', 'string')),
		numberImpl:    catching(() => spy('fn', 42)),
		undefImpl:     catching(() => spy('fn', undefined)),
	};
}

function spyValidationErrors(r) {
	assert.match(r.emptyName.message,  /non-empty string name/);
	assert.match(r.nullName.message,   /non-empty string name/);
	assert.match(r.numberName.message, /non-empty string name/);
	assert.match(r.stringImpl.message, /implementation must be a function/);
	assert.match(r.numberImpl.message, /implementation must be a function/);
	assert.strictEqual(r.undefImpl, null, 'undefined impl should not throw');
}

when(spyValidation)
	.hasInputs({ name: 'spy validation', value: null })
	.expect.output(spyValidationErrors)
	.assert();

// ── functionCall() ────────────────────────────────────────────────────────────

function functionCallNames(_) {
	const fn = spy('saves record');
	return {
		noop:      functionCall(fn).name,
		times0:    functionCall(fn, { times: 0 }).name,
		times1:    functionCall(fn, { times: 1 }).name,
		times3:    functionCall(fn, { times: 3 }).name,
		argsOnly:  functionCall(fn, { arguments: [{ id: 1 }] }).name,
		timesArgs: functionCall(fn, { times: 2, arguments: [{ id: 1 }] }).name,
	};
}

function functionCallNamesCorrect(r) {
	assert.strictEqual(r.noop,   'saves record was called');
	assert.strictEqual(r.times0, 'saves record was not called');
	assert.strictEqual(r.times1, 'saves record was called once');
	assert.strictEqual(r.times3, 'saves record was called 3 times');
	assert.ok(r.argsOnly.includes('was called') && r.argsOnly.includes('with'));
	assert.ok(r.timesArgs.includes('2 times')   && r.timesArgs.includes('with'));
}

when(functionCallNames)
	.hasInputs({ name: 'functionCall name formats', value: null })
	.expect.output(functionCallNamesCorrect)
	.assert();

function functionCallAssertBehavior(_) {
	function make() { return spy('fn'); }
	const called1 = make(); called1();
	const uncalled = make();
	const called2  = make(); called2(); called2();
	const argsRight = make(); argsRight('wrong'); argsRight('right');
	const argsWrong = make(); argsWrong('wrong');
	const timesArgs = make(); timesArgs('x'); timesArgs('y');
	const notCalledArgs = make();
	return {
		passWasCalled:     catching(() => functionCall(called1).assert(undefined)),
		failNotCalled:     catching(() => functionCall(uncalled).assert(undefined)),
		passNotCalled:     catching(() => functionCall(uncalled, { times: 0 }).assert(undefined)),
		failCalledWhen0:   catching(() => functionCall(called1, { times: 0 }).assert(undefined)),
		passTimes2:        catching(() => functionCall(called2, { times: 2 }).assert(undefined)),
		failTimes2Wrong:   catching(() => functionCall(called1, { times: 2 }).assert(undefined)),
		passArgs:          catching(() => functionCall(argsRight, { arguments: ['right'] }).assert(undefined)),
		failArgs:          catching(() => functionCall(argsWrong, { arguments: ['right'] }).assert(undefined)),
		passTimesArgs:     catching(() => functionCall(timesArgs, { times: 2, arguments: ['x'] }).assert(undefined)),
		passNotCalledArgs: catching(() => functionCall(notCalledArgs, { times: 0, arguments: ['x'] }).assert(undefined)),
		nonSpy1:           catching(() => functionCall(() => {})),
		nonSpy2:           catching(() => functionCall(null)),
	};
}

function functionCallAssertCorrect(r) {
	assert.strictEqual(r.passWasCalled,     null);
	assert.ok(r.failNotCalled   instanceof Error);
	assert.strictEqual(r.passNotCalled,     null);
	assert.ok(r.failCalledWhen0 instanceof Error);
	assert.strictEqual(r.passTimes2,        null);
	assert.ok(r.failTimes2Wrong instanceof Error);
	assert.strictEqual(r.passArgs,          null);
	assert.ok(r.failArgs        instanceof Error);
	assert.strictEqual(r.passTimesArgs,     null);
	assert.strictEqual(r.passNotCalledArgs, null);
	assert.match(r.nonSpy1.message, /requires a spy/);
	assert.match(r.nonSpy2.message, /requires a spy/);
}

when(functionCallAssertBehavior)
	.hasInputs({ name: 'functionCall assert behavior', value: null })
	.expect.output(functionCallAssertCorrect)
	.assert();

// ── wasCalled / wasCalledOnce / wasCalledTimes / wasCalledWith / wasNotCalled ─

function callCountMatchers(_) {
	const once   = spy('logs event'); once();
	const twice  = spy('logs event'); twice(); twice();
	const thrice = spy('fn');         thrice(); thrice(); thrice();
	const deep   = spy('fn');         deep({ nested: { value: 42 } });
	const never  = spy('fn');
	return {
		wasCalledName:      wasCalled(once).name,
		wasCalledPass:      catching(() => wasCalled(once).assert(undefined)),
		wasCalledMulti:     catching(() => wasCalled(twice).assert(undefined)),
		wasCalledFail:      catching(() => wasCalled(never).assert(undefined)),
		wasCalledNonSpy:    catching(() => wasCalled(() => {})),

		wasCalledOnceName:  wasCalledOnce(spy('sends email')).name,
		wasCalledOncePass:  catching(() => wasCalledOnce(once).assert(undefined)),
		wasCalledOnceFail0: catching(() => wasCalledOnce(never).assert(undefined)),
		wasCalledOnceFail2: catching(() => wasCalledOnce(twice).assert(undefined)),

		times1Name:         wasCalledTimes(spy('fn'), 1).name,
		times3Name:         wasCalledTimes(spy('fn'), 3).name,
		times0Name:         wasCalledTimes(spy('fn'), 0).name,
		timesPass:          catching(() => wasCalledTimes(thrice, 3).assert(undefined)),
		timesFail:          catching(() => wasCalledTimes(once, 3).assert(undefined)),
		timesFloat:         catching(() => wasCalledTimes(once, 1.5)),
		timesNeg:           catching(() => wasCalledTimes(once, -1)),
		timesStr:           catching(() => wasCalledTimes(once, 'two')),

		withName:           wasCalledWith(deep, [{ id: 1 }]).name.startsWith('fn was called with'),
		withPass:           catching(() => wasCalledWith(deep, [{ nested: { value: 42 } }]).assert(undefined)),
		withFail:           catching(() => wasCalledWith(deep, [{ nested: { value: 99 } }]).assert(undefined)),
		withNeverCalled:    catching(() => wasCalledWith(never, ['x']).assert(undefined)),

		notCalledName:      wasNotCalled(spy('sends email')).name,
		notCalledPass:      catching(() => wasNotCalled(never).assert(undefined)),
		notCalledFail:      catching(() => wasNotCalled(once).assert(undefined)),
	};
}

function callCountMatchersCorrect(r) {
	assert.strictEqual(r.wasCalledName,     'logs event was called');
	assert.strictEqual(r.wasCalledPass,     null);
	assert.strictEqual(r.wasCalledMulti,    null);
	assert.ok(r.wasCalledFail    instanceof Error);
	assert.match(r.wasCalledNonSpy.message, /requires a spy/);

	assert.strictEqual(r.wasCalledOnceName, 'sends email was called once');
	assert.strictEqual(r.wasCalledOncePass, null);
	assert.ok(r.wasCalledOnceFail0 instanceof Error);
	assert.ok(r.wasCalledOnceFail2 instanceof Error);

	assert.strictEqual(r.times1Name, 'fn was called 1 time');
	assert.strictEqual(r.times3Name, 'fn was called 3 times');
	assert.strictEqual(r.times0Name, 'fn was called 0 times');
	assert.strictEqual(r.timesPass, null);
	assert.ok(r.timesFail  instanceof Error);
	assert.match(r.timesFloat.message, /non-negative integer/);
	assert.match(r.timesNeg.message,   /non-negative integer/);
	assert.match(r.timesStr.message,   /non-negative integer/);

	assert.strictEqual(r.withName, true);
	assert.strictEqual(r.withPass, null);
	assert.ok(r.withFail        instanceof Error);
	assert.ok(r.withNeverCalled instanceof Error);

	assert.strictEqual(r.notCalledName, 'sends email was not called');
	assert.strictEqual(r.notCalledPass, null);
	assert.ok(r.notCalledFail instanceof Error);
}

when(callCountMatchers)
	.hasInputs({ name: 'call count matchers', value: null })
	.expect.output(callCountMatchersCorrect)
	.assert();

// ── wasCalledBefore / wasCalledAfter ──────────────────────────────────────────

function orderingMatchers(_) {
	const a1 = spy('a'); const b1 = spy('b');
	a1(); b1();  // a before b

	const a2 = spy('a'); const b2 = spy('b');
	b2(); a2();  // b before a

	const a3 = spy('a'); const b3 = spy('b');
	b3();  // a never called

	const a4 = spy('a'); const b4 = spy('b');
	a4();  // b never called

	// first-call semantics
	const a5 = spy('first'); const b5 = spy('second');
	a5(); b5(); a5();

	return {
		beforeName:        wasCalledBefore(spy('validates input'), spy('saves record')).name,
		beforePass:        catching(() => wasCalledBefore(a1, b1).assert(undefined)),
		beforeFail:        catching(() => wasCalledBefore(a2, b2).assert(undefined)),
		beforeNeverFirst:  catching(() => wasCalledBefore(a3, b3).assert(undefined)),
		beforeNeverSecond: catching(() => wasCalledBefore(a4, b4).assert(undefined)),
		beforeFirstCall:   catching(() => wasCalledBefore(a5, b5).assert(undefined)),
		beforeNonSpy1:     catching(() => wasCalledBefore(() => {}, b1)),
		beforeNonSpy2:     catching(() => wasCalledBefore(a1, () => {})),

		afterName:         wasCalledAfter(spy('notifies user'), spy('saves record')).name,
		afterPass:         catching(() => wasCalledAfter(a2, b2).assert(undefined)),
		afterFail:         catching(() => wasCalledAfter(a1, b1).assert(undefined)),
		afterNeverFirst:   catching(() => wasCalledAfter(a3, b3).assert(undefined)),
		afterNonSpy1:      catching(() => wasCalledAfter(() => {}, b1)),
		afterNonSpy2:      catching(() => wasCalledAfter(a1, () => {})),

		seqResetCheck:     (function() { const fn = spy('fn'); fn(); fn(); fn.reset(); return fn._callSeqs.length; })(),
	};
}

function orderingMatchersCorrect(r) {
	assert.strictEqual(r.beforeName, 'validates input was called before saves record');
	assert.strictEqual(r.beforePass, null);
	assert.ok(r.beforeFail        instanceof Error);
	assert.ok(r.beforeNeverFirst  instanceof Error);
	assert.ok(r.beforeNeverSecond instanceof Error);
	assert.strictEqual(r.beforeFirstCall, null);
	assert.match(r.beforeNonSpy1.message, /requires a spy/);
	assert.match(r.beforeNonSpy2.message, /requires a spy/);

	assert.strictEqual(r.afterName, 'notifies user was called after saves record');
	assert.strictEqual(r.afterPass, null);
	assert.ok(r.afterFail        instanceof Error);
	assert.ok(r.afterNeverFirst  instanceof Error);
	assert.match(r.afterNonSpy1.message, /requires a spy/);
	assert.match(r.afterNonSpy2.message, /requires a spy/);

	assert.strictEqual(r.seqResetCheck, 0, '_callSeqs should be cleared by reset()');
}

when(orderingMatchers)
	.hasInputs({ name: 'ordering matchers', value: null })
	.expect.output(orderingMatchersCorrect)
	.assert();

// ── wasCalledFirst / wasCalledLast ────────────────────────────────────────────

function firstLastMatchers(_) {
	const a1 = spy('a'); const b1 = spy('b'); const c1 = spy('c');
	a1(); b1(); c1();

	const a2 = spy('a'); const b2 = spy('b'); const c2 = spy('c');
	b2(); a2(); c2();  // a not first

	const a3 = spy('a'); const b3 = spy('b');
	b3();  // a never called

	const a4 = spy('a'); const b4 = spy('b'); const c4 = spy('c');
	a4(); b4();  // c never called

	const a5 = spy('a'); const b5 = spy('b');
	a5(); b5();  // single other (like wasCalledBefore)

	return {
		firstName:        wasCalledFirst(spy('validates input'), spy('saves record'), spy('notifies user')).name,
		firstPass:        catching(() => wasCalledFirst(a1, b1, c1).assert(undefined)),
		firstFail:        catching(() => wasCalledFirst(a2, b2, c2).assert(undefined)),
		firstNeverTarget: catching(() => wasCalledFirst(a3, b3).assert(undefined)),
		firstNeverOther:  catching(() => wasCalledFirst(a4, b4, c4).assert(undefined)),
		firstSingleOther: catching(() => wasCalledFirst(a5, b5).assert(undefined)),
		firstNonSpy1:     catching(() => wasCalledFirst(() => {}, b1)),
		firstNonSpy2:     catching(() => wasCalledFirst(a1, () => {})),

		lastName:         wasCalledLast(spy('notifies user'), spy('validates input'), spy('saves record')).name,
		lastPass:         catching(() => wasCalledLast(c1, a1, b1).assert(undefined)),
		lastFail:         (function() { const x = spy('x'); const y = spy('y'); const z = spy('z'); x(); z(); y(); return catching(() => wasCalledLast(z, x, y).assert(undefined)); })(),
		lastNeverTarget:  (function() { const x = spy('x'); const y = spy('y'); x(); return catching(() => wasCalledLast(y, x).assert(undefined)); })(),
		lastNeverOther:   (function() { const x = spy('x'); const y = spy('y'); const z = spy('z'); x(); z(); return catching(() => wasCalledLast(z, x, y).assert(undefined)); })(),
		lastNonSpy1:      catching(() => wasCalledLast(() => {}, b1)),
		lastNonSpy2:      catching(() => wasCalledLast(a1, () => {})),
	};
}

function firstLastMatchersCorrect(r) {
	assert.strictEqual(r.firstName, 'validates input was called first');
	assert.strictEqual(r.firstPass, null);
	assert.ok(r.firstFail        instanceof Error);
	assert.ok(r.firstNeverTarget instanceof Error);
	assert.ok(r.firstNeverOther  instanceof Error);
	assert.strictEqual(r.firstSingleOther, null);
	assert.match(r.firstNonSpy1.message, /requires a spy/);
	assert.match(r.firstNonSpy2.message, /requires a spy/);

	assert.strictEqual(r.lastName, 'notifies user was called last');
	assert.strictEqual(r.lastPass, null);
	assert.ok(r.lastFail        instanceof Error);
	assert.ok(r.lastNeverTarget instanceof Error);
	assert.ok(r.lastNeverOther  instanceof Error);
	assert.match(r.lastNonSpy1.message, /requires a spy/);
	assert.match(r.lastNonSpy2.message, /requires a spy/);
}

when(firstLastMatchers)
	.hasInputs({ name: 'first/last matchers', value: null })
	.expect.output(firstLastMatchersCorrect)
	.assert();

// ── returns() ─────────────────────────────────────────────────────────────────

function returnsHelper(_) {
	const single   = spy('fetches user', returns({ id: 1 }));
	const sequence = spy('fetches status', returns(503, 503, 200));
	const sticky   = spy('fetches status', returns(503, 200));
	single(); single();
	sequence(); sequence(); sequence();
	sticky(); sticky(); sticky(); sticky();
	let attempts = 0;
	const retry = spy('retries', returns(null, null, { id: 42 }));
	let result;
	do { result = retry(); attempts++; } while (!result);
	const records = spy('saves record', returns(true, false));
	records('a'); records('b'); records('c');
	return {
		singleFirst:   single._calls[0],
		singleSecond:  single._calls[1],
		singleReturn1: (spy('s', returns({ id: 1 })))(),
		singleReturn2: (function() { const s = spy('s', returns({ id: 1 })); s(); return s(); })(),
		seq0:          sequence._calls[0],
		seq503_503_200:'503 503 200',  // we verify via behavior
		sticky503:     (function() { const s = spy('s', returns(503, 200)); s(); s(); s(); s(); return s._calls.length; })(),
		retryAttempts: attempts,
		retryResult:   result,
		recordCalls:   records._calls.length,
		emptyThrows:   catching(() => returns()),
	};
}

function returnsHelperBehavior(r) {
	assert.strictEqual(r.retryAttempts, 3);
	assert.deepStrictEqual(r.retryResult, { id: 42 });
	assert.strictEqual(r.recordCalls, 3);
	assert.match(r.emptyThrows.message, /at least one value/);
	assert.strictEqual(r.sticky503, 4, 'sticky: all four calls recorded');
}

when(returnsHelper)
	.hasInputs({ name: 'returns helper', value: null })
	.expect.output(returnsHelperBehavior)
	.assert();

// ── Integration: spy matchers through runner ──────────────────────────────────

async function integrationSpyMatchers(_) {
	const { runner: r, when: w } = createRunner();
	const mockLogger = spy('logs warning');
	function processPayment(input) {
		if (!input.amount || input.amount <= 0) input.logger('invalid amount');
		return { status: 'rejected' };
	}
	const badPayment = { name: 'zero-amount payment', amount: 0, logger: mockLogger };
	w(processPayment).hasInputs(badPayment).expect.output(
		wasCalledOnce(mockLogger),
		wasCalledWith(mockLogger, ['invalid amount'])
	).assert();
	const suite = await r.run();
	return { suite, specs: r._tests[0].specResults };
}

function integrationSpyMatchersCorrect(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specs.length, 2);
	assert.strictEqual(result.specs[0].name, 'logs warning was called once');
	assert.strictEqual(result.specs[1].name, 'logs warning was called with ["invalid amount"]');
}

when(integrationSpyMatchers)
	.hasInputs({ name: 'spy matchers integration', value: null })
	.expect.output(integrationSpyMatchersCorrect)
	.assert();

async function integrationFunctionCall(_) {
	const { runner: r, when: w } = createRunner();
	const mockNotify = spy('notifies user');
	function createAccount(input) { input.notify(input.email); return { id: 'acc-1', email: input.email }; }
	const newUser = { name: 'new user', email: 'alice@example.com', notify: mockNotify };
	w(createAccount).hasInputs(newUser).expect.output(
		functionCall(mockNotify, { times: 1, arguments: ['alice@example.com'] })
	).assert();
	const suite = await r.run();
	return { suite, specName: r._tests[0].specResults[0].name };
}

function integrationFunctionCallCorrect(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specName, 'notifies user was called once with ["alice@example.com"]');
}

when(integrationFunctionCall)
	.hasInputs({ name: 'functionCall integration', value: null })
	.expect.output(integrationFunctionCallCorrect)
	.assert();

async function integrationWasNotCalledFails(_) {
	const { runner: r, when: w } = createRunner();
	const mockAudit = spy('writes audit log');
	function silentOp(input) { mockAudit('called anyway'); return input.value; }
	w(silentOp).hasInputs({ name: 'silent input', value: 42 }).expect.output(wasNotCalled(mockAudit)).assert();
	const suite = await r.run();
	return { suite, specResult: r._tests[0].specResults[0] };
}

function integrationWasNotCalledFailsCorrect(result) {
	assert.strictEqual(result.suite.failed, 1);
	assert.strictEqual(result.specResult.name,   'writes audit log was not called');
	assert.strictEqual(result.specResult.result, 'fail');
}

when(integrationWasNotCalledFails)
	.hasInputs({ name: 'wasNotCalled integration fail', value: null })
	.expect.output(integrationWasNotCalledFailsCorrect)
	.assert();

async function integrationSpyReset(_) {
	const mockSave = spy('saves record');
	function writeOnce(input) { input.save('data'); return true; }

	const { runner: r1, when: w1 } = createRunner();
	w1(writeOnce).hasInputs({ name: 'first write', save: mockSave }).expect.output(wasCalledOnce(mockSave)).assert();
	await r1.run();

	mockSave.reset();

	const { runner: r2, when: w2 } = createRunner();
	w2(writeOnce).hasInputs({ name: 'second write', save: mockSave }).expect.output(wasCalledOnce(mockSave)).assert();
	return r2.run();
}

function integrationSpyResetCorrect(suite) {
	assert.strictEqual(suite.passed, 1);
}

when(integrationSpyReset)
	.hasInputs({ name: 'spy reset isolates history', value: null })
	.expect.output(integrationSpyResetCorrect)
	.assert();

async function integrationWasCalledBefore(_) {
	const { runner: r, when: w } = createRunner();
	const mockValidate = spy('validates input');
	const mockSave     = spy('saves record');
	function processForm(input) { input.validate(input.data); input.save(input.data); return { ok: true }; }
	const formInput = { name: 'valid form submission', data: { email: 'user@example.com' }, validate: mockValidate, save: mockSave };
	w(processForm).hasInputs(formInput).expect.output(wasCalledBefore(mockValidate, mockSave)).assert();
	const suite = await r.run();
	return { suite, specName: r._tests[0].specResults[0].name };
}

function integrationWasCalledBeforeCorrect(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specName, 'validates input was called before saves record');
}

when(integrationWasCalledBefore)
	.hasInputs({ name: 'wasCalledBefore integration', value: null })
	.expect.output(integrationWasCalledBeforeCorrect)
	.assert();

async function integrationWasCalledAfterFails(_) {
	const { runner: r, when: w } = createRunner();
	const mockA = spy('step A');
	const mockB = spy('step B');
	function wrongOrder(input) { input.b(); input.a(); return true; }
	w(wrongOrder).hasInputs({ name: 'wrong order input', a: mockA, b: mockB }).expect.output(wasCalledAfter(mockB, mockA)).assert();
	return r.run();
}

function integrationWasCalledAfterFailsCorrect(suite) {
	assert.strictEqual(suite.failed, 1);
}

when(integrationWasCalledAfterFails)
	.hasInputs({ name: 'wasCalledAfter integration fail', value: null })
	.expect.output(integrationWasCalledAfterFailsCorrect)
	.assert();

async function integrationReturnsWithRunner(_) {
	const { runner: r, when: w } = createRunner();
	const mockFetch = spy('fetches user', returns(null, { id: 1, name: 'Alice' }));
	function loadUser(input) {
		let user = null;
		while (!user) user = input.fetch(input.userId);
		return user;
	}
	w(loadUser).hasInputs({ name: 'retry until resolved', userId: 'u1', fetch: mockFetch }).expect.output(wasCalledTimes(mockFetch, 2)).assert();
	return r.run();
}

function integrationReturnsCorrect(suite) {
	assert.strictEqual(suite.passed, 1);
}

when(integrationReturnsWithRunner)
	.hasInputs({ name: 'returns integration with runner', value: null })
	.expect.output(integrationReturnsCorrect)
	.assert();

async function integrationFirstLast(_) {
	const { runner: r, when: w } = createRunner();
	const mockValidate = spy('validates input');
	const mockSave     = spy('saves record');
	const mockNotify   = spy('notifies user');
	function createOrder(input) { input.validate(input.order); input.save(input.order); input.notify(input.order.id); return { ok: true }; }
	const orderInput = { name: 'valid order', order: { id: 'ord-1', total: 99 }, validate: mockValidate, save: mockSave, notify: mockNotify };
	w(createOrder).hasInputs(orderInput).expect.output(
		wasCalledFirst(mockValidate, mockSave, mockNotify),
		wasCalledLast(mockNotify, mockValidate, mockSave)
	).assert();
	const suite = await r.run();
	return { suite, specs: r._tests[0].specResults };
}

function integrationFirstLastCorrect(result) {
	assert.strictEqual(result.suite.passed, 1);
	assert.strictEqual(result.specs[0].name, 'validates input was called first');
	assert.strictEqual(result.specs[1].name, 'notifies user was called last');
}

when(integrationFirstLast)
	.hasInputs({ name: 'wasCalledFirst/Last integration', value: null })
	.expect.output(integrationFirstLastCorrect)
	.assert();
