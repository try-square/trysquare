# trysquare — AI Assistant Context

trysquare is a JavaScript testing library where the test chain is the specification.
There are no `describe`, `it`, or `test` wrappers. Each test is a fluent chain:

```js
when(component).hasInputs(input).expect.output(specFunction).assert()
```

The chain is structured data — not a string. Documentation is generated from the
same chain that drives assertions, so it cannot drift from the implementation.

---

## What NOT to write — patterns that do not exist in trysquare

```js
// WRONG — no describe/it/test wrappers
describe('myFunction', () => {
    it('returns the correct value', () => { ... });
});

// WRONG — suite() was explicitly rejected and does not exist
suite('myFunction', () => { ... });

// WRONG — anonymous spec function (throws at registration time)
when(myFn).hasInputs(x).expect.output(n => assert.equal(n, 42)).assert();

// WRONG — anonymous input object (missing required name property)
when(myFn).hasInputs({ value: someInput }).expect.output(mySpec).assert();
```

---

## The chain grammar

```
when(component)
  [.inState(lifecycleState)]         // optional — for stateful components
  .hasInputs({ name, value })        // name is required (string), value is the input
  [.andInputs(moreInputs)]           // additional inputs for curried functions
  [.stubs(stubMap)]                  // dependency injection — stubMap must have .name
  .expect
  .output(specFunction)              // for pure transformations → specFn receives output
  // OR
  .behaviors(...specFunctions)       // for stateful components
  [.sideEffects(...specFunctions)]
  .assert([options])                 // registers the test
```

`assert()` options: `{ timeout, only, skip, retries, parallel, sequential }`

---

## Naming requirements — every named entity must have a .name

The library enforces this at registration time. It throws — not warns.

```js
// inputs must have a name property
const validCredentials = { name: 'valid credentials', value: { user: 'alice', pass: 'secret' } };

// spec functions must be named function declarations or named expressions
function returnsToken(result) {
    assert.ok(result.token);
}

// stubs must have a name property
const httpStub = { name: 'http stub', get: sinon.stub() };
```

Anonymous arrow functions as spec functions always throw. Use named function
declarations instead.

---

## Complete working example

```js
// math.test.js
const assert = require('node:assert');
const { Runner, makeWhen } = require('@trysquare/core');
const { double } = require('./math');

const runner = new Runner();
const when = makeWhen(runner);

const smallNumber    = { name: 'small number',    value: 4  };
const zero           = { name: 'zero',            value: 0  };
const negativeNumber = { name: 'negative number', value: -3 };

function doublesTheInput(result) {
    assert.strictEqual(result, smallNumber.value * 2);
}

function doubleOfZeroIsZero(result) {
    assert.strictEqual(result, 0);
}

function doubleOfNegativeIsNegative(result) {
    assert.ok(result < 0);
}

when(double).hasInputs(smallNumber).expect.output(doublesTheInput).assert();
when(double).hasInputs(zero).expect.output(doubleOfZeroIsZero).assert();
when(double).hasInputs(negativeNumber).expect.output(doubleOfNegativeIsNegative).assert();

module.exports = runner;
```

```js
// run-tests.js — executes the suite (separate from test registration)
const runner = require('./math.test');

runner.run().then(function onSuiteComplete(suite) {
    console.log(`${suite.passed} passed, ${suite.failed} failed`);
    if (suite.failed > 0) process.exit(1);
});
```

---

## Branching — shared base scenarios

`when()` returns an immutable builder. Each `.assert()` call is an independent test.
Branches from the same base are automatically grouped in output.

```js
// Build once
const loginAttempt = when(LoginForm).hasInputs(validCredentials);

// Branch independently — no wrapper needed
loginAttempt.stubs(happyPath).expect.output(authenticatesUser).assert();
loginAttempt.stubs(networkError).expect.output(showsErrorMessage).assert();
loginAttempt.stubs(badPassword).expect.output(showsPasswordError).assert();
```

There is no `suite()`. Grouping is automatic. Do not add a suite wrapper.

---

## Testing error paths

Use a `catching` helper to convert throws into return values:

```js
function catching(fn) {
    try { fn(); return null; }
    catch (err) { return err; }
}

function myFunction(input) {
    return catching(() => riskyOperation(input));
}

function throwsOnNullInput(result) {
    assert.ok(result instanceof Error);
    assert.match(result.message, /input required/);
}

when(myFunction).hasInputs(nullInput).expect.output(throwsOnNullInput).assert();
```

---

## Framework packages

```js
// React — extends runner with React lifecycle support
const { setupReactRunner, mount, withProps, withStubs } = require('@trysquare/react');
const unsetup = setupReactRunner(runner, { renderFn: render });

// Angular — extends runner with Angular DI + lifecycle
const { setupAngularRunner, mount, withInputs, withStubs } = require('@trysquare/angular');
const unsetup = setupAngularRunner(runner, { fixtureFactory: async () => fixture });
```

The chain grammar is the same for all frameworks. `mount(Component)` replaces the
plain function argument to `when()`.

---

## Focus and ignore

```js
when(Component).focus()                     // focus all tests for this component
when(Component).hasInputs(x).focus()        // focus all branches from this base
chain.ignore().expect.output(spec).assert() // ignore this specific branch
.assert({ only: true })                     // focus this test
.assert({ skip: true })                     // skip this test
```

If any test is focused and `process.env.CI` is set, the runner throws by default.

---

## Reporter configuration

```js
// test.config.js (consumed by the trysquare CLI)
export default {
    execution: 'parallel',
    timeout: 5000,
    reporters: [
        ['markdown', { output: './docs/spec.md' }],
        ['junit',    { output: './test-results/junit.xml' }],
        ['html',     { output: './docs/spec.html' }],
        ['console'],
    ],
};
```

---

## File conventions

- Test files: `foo.test.js` co-located with source (`lib/foo.js` → `lib/foo.test.js`)
- Module format: CommonJS (`require` / `module.exports`) — no ESM, no `"type": "module"`
- All packages in `packages/*` under the `@trysquare` npm scope
- Named functions everywhere — no anonymous exports or anonymous callbacks

---

## When adding tests to an existing trysquare project

1. Find `*.test.js` co-located with the source file you're testing
2. The runner and `when` are already set up — add `when()` chains to the file
3. Define named input objects (`{ name, value }`) and named spec functions
4. Register each scenario with `.assert()` at the bottom of the file
5. Do not add `describe`/`it`/`test` blocks — they do not belong here
