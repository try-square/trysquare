# trysquare — AI Assistant Context

trysquare is a JavaScript testing library where the test chain is the specification.
There are no `describe`, `it`, or `test` wrappers. Each test is a fluent chain:

```js
when(component).hasInputs(input).expect.output(matcher).assert()
```

The chain is structured data — not a string. Documentation is generated from the
same chain that drives assertions, so it cannot drift from the implementation.

---

## Do not use these patterns — they do not exist in trysquare

```js
// WRONG — no describe/it/test wrappers
describe('formatCurrency', () => {
    it('formats whole dollars', () => { ... });
});

// WRONG — suite() was explicitly rejected and does not exist
suite('formatCurrency', () => { ... });

// WRONG — no raw assert calls in spec position (use matchers instead)
when(fn).hasInputs(x).expect.output(n => assert.strictEqual(n, 42)).assert();

// WRONG — anonymous functions throw at registration time
when(fn).hasInputs(x).expect.output(result => { ... }).assert();

// WRONG — no new Runner() or makeWhen() in normal test files
const runner = new Runner();
const when = makeWhen(runner);

// WRONG — no module.exports = runner, no run-tests.js
module.exports = runner;
```

---

## Setup — what a test file looks like

```js
// formatCurrency.test.js
const { when } = require('@trysquare/core');
const { equals } = require('@trysquare/matchers');
const { formatCurrency } = require('./format');

const wholeDollars = { name: 'whole dollar amount', value: 1000 };
const withCents    = { name: 'amount with cents',   value: 10.5 };

when(formatCurrency).hasInputs(wholeDollars).expect.output(equals('$1,000.00')).assert();
when(formatCurrency).hasInputs(withCents).expect.output(equals('$10.50')).assert();
```

`when` is already bound to the singleton runner. The CLI discovers and runs all
`*.test.js` files automatically. There is no runner setup and no entry file.

---

## Running tests

```json
// package.json
{
  "scripts": {
    "test": "trysquare"
  }
}
```

```bash
npm test
# 2 passed, 0 failed
```

No `runner.run()`. No `run-tests.js`. The `trysquare` CLI handles discovery and execution.

---

## The chain grammar

```
when(component)
  [.inState(lifecycleState)]         // optional — for stateful components
  .hasInputs({ name, value })        // name is required (string), value is the input
  [.andInputs(moreInputs)]           // additional inputs for curried functions
  [.stubs(stubMap)]                  // dependency injection — stubMap must have .name
  .expect
  .output(matcher)                   // for pure transformations
  [.sideEffects(matcher, ...)]       // optional side effect assertions
  // OR
  .behaviors(matcher, ...)           // for stateful components
  [.sideEffects(matcher, ...)]
  .assert([options])                 // registers the test
```

`assert()` options: `{ timeout, only, skip, retries, parallel, sequential }`

---

## Matchers — always use these instead of raw assertions

Install: `npm install --save-dev @trysquare/matchers`

```js
const { equals, deepEquals, includes, hasProperty,
        isType, isNull, isDefined, matches,
        spy, wasCalled, wasCalledOnce, wasCalledTimes,
        wasCalledWith, wasNotCalled, functionCall } = require('@trysquare/matchers');
```

Matchers return `{ name, assert }` objects. The `name` is used in generated documentation.

```js
equals('$1,000.00')          // name: 'equals "$1,000.00"'
deepEquals({ a: 1 })         // name: 'deeply equals { a: 1 }'
includes('welcome')          // name: 'includes "welcome"'
hasProperty('token')         // name: 'has property "token"'
isNull()                     // name: 'is null'
isDefined()                  // name: 'is defined'
isType('string')             // name: 'is type "string"'
matches(/^\d{4}$/)           // name: 'matches /^\d{4}$/'
wasCalled(mySpy)             // name: 'my spy was called'
wasCalledOnce(mySpy)         // name: 'my spy was called once'
wasCalledWith(mySpy, [args]) // name: 'my spy was called with [...]'
wasNotCalled(mySpy)          // name: 'my spy was not called'
```

---

## Naming requirements — every named entity must have a .name

The library enforces this at registration time. It throws — not warns.

```js
// inputs must have a name property
const userInput = { name: 'valid user data', value: { email: 'alice@example.com' } };

// stubs must have a name property
const mailer = { name: 'mailer', send: spy('send email') };

// spy() requires a name string
const send = spy('send email');
```

Use matchers from `@trysquare/matchers` as spec functions — they are pre-named.
If you write a custom spec function, it must be a named function declaration.

---

## Side effects

```js
const { when } = require('@trysquare/core');
const { equals, spy, wasCalledWith } = require('@trysquare/matchers');
const { createUser } = require('./users');

const send    = spy('send welcome email');
const mailer  = { name: 'mailer', send };
const newUser = { name: 'new user', value: { email: 'alice@example.com' } };

when(createUser)
    .hasInputs(newUser)
    .stubs(mailer)
    .expect
    .output(equals({ created: true }))
    .sideEffects(wasCalledWith(send, [{ to: 'alice@example.com', subject: 'Welcome' }]))
    .assert();
```

Generated documentation:

```markdown
# createUser

## new user (mailer)

**Output**
- ✓ equals { created: true }

**Side effects**
- ✓ send welcome email was called with [{ to: "alice@example.com", subject: "Welcome" }]
```

---

## Branching — shared base scenarios

`when()` returns an immutable builder. Branches from the same base are grouped automatically.

```js
const validCredentials = { name: 'valid credentials', value: { user: 'alice', pass: 'secret' } };

const loginAttempt = when(login).hasInputs(validCredentials);

loginAttempt.stubs(successStubs).expect.output(equals({ token: 'abc123' })).assert();
loginAttempt.stubs(networkErrorStubs).expect.output(equals({ error: 'network unavailable' })).assert();
loginAttempt.stubs(badPasswordStubs).expect.output(equals({ error: 'invalid credentials' })).assert();
```

Generated documentation:

```markdown
# login

## valid credentials

### success

**Output**
- ✓ equals { token: "abc123" }

### network error

**Output**
- ✓ equals { error: "network unavailable" }
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

when(myFunction)
    .hasInputs(nullInput)
    .expect
    .output(isType('error'))
    .assert();
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
plain function argument to `when()`. Framework packages require a runner instance —
use `createRunner()` from `@trysquare/core` to get an isolated `{ runner, when }` pair.

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
// test.config.js
module.exports = {
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

Install `@trysquare/reporters` for markdown, HTML, PDF, and JUnit output.

---

## File conventions

- Test files: `foo.test.js` co-located with source (`lib/foo.js` → `lib/foo.test.js`)
- Module format: CommonJS (`require` / `module.exports`) — no ESM, no `"type": "module"`
- All packages in `packages/*` under the `@trysquare` npm scope
- Named functions everywhere — no anonymous exports or anonymous callbacks

---

## When adding tests to an existing trysquare project

1. Find `*.test.js` co-located with the source file you're testing
2. `when` is already imported — add `when()` chains to the file
3. Use matchers from `@trysquare/matchers` as spec functions
4. Define named input objects (`{ name, value }`) and named stub objects (`{ name, ...stubs }`)
5. Register each scenario with `.assert()` at the bottom of the file
6. Do not add `describe`/`it`/`test` blocks — they do not belong here
7. Do not write `new Runner()`, `makeWhen()`, or `module.exports = runner`
