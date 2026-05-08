# trysquare — Claude Code Context

## What this project is

trysquare is a JavaScript testing library where the test chain is simultaneously
the specification and the verification. The description cannot drift from the
behavior because they are the same object. Tests generate documentation
automatically — no separate doc comments to maintain.

Named after the try square — a craftsman's tool for verifying work meets a known
standard (exactly 90 degrees, exactly flat). Tests verify code meets specified
behavior. The "try" in the name is intentional.

**npm org:** @trysquare
**Status:** Pre-implementation. Design is complete. No production code exists yet.
**Design document:** DESIGN-testing-library-v3.docx (in project Drive folder)

## The problem this solves

Existing JavaScript testing frameworks (Jest, Mocha, Vitest) have two fundamental
weaknesses:

1. Test descriptions are arbitrary strings — no enforced relationship to what is
   actually being tested. Documentation generated from these tests reflects strings
   developers wrote, not a verified specification of behavior.

2. Documentation drifts from code. JSDoc, README files, and comments describe what
   a system does — but none of them are verified against the implementation.

trysquare addresses both by making the test chain the specification. The chain is
structured data, not a string. The doc generator derives output from the same
objects that drive assertions. They cannot drift because they are the same artifact.

## Package structure

```
trysquare/                      monorepo root
  packages/
    core/                       @trysquare/core — foundation, no framework deps
    reporters/                  @trysquare/reporters — MarkdownReporter, HTMLReporter,
                                                        PDFReporter, JUnitReporter,
                                                        ConsoleReporter
    react/                      @trysquare/react — React lifecycle extensions
    angular/                    @trysquare/angular — Angular DI + lifecycle extensions
    ts/                         @trysquare/ts — TypeScript type definitions only
    factories/                  @trysquare/factories — optional input factory helpers
  CLAUDE.md                     this file
```

## Module format — critical

All packages use **CommonJS** (`require`/`module.exports`). No `"type": "module"`
in any package.json. No ESM. This is a firm decision.

The placeholder packages published to npm must have `"type": "module"` removed
before any implementation begins.

## Core API — do not change without updating the design document

Three scenario types:

```javascript
// Type 1: Pure transformation
when(fn).hasInputs(inputs).expect.output(outputSpec).assert()

// Type 2: Stateful component
when(component).inState(lifecycleState).expect.behaviors(...specs).sideEffects(...specs).assert()

// Type 3: User interaction sequence
when(component).isInitialized().andUser(action1).andUser(action2).expect.behaviors(...).assert()
```

Modifiers:
```javascript
.andInputs(x)       // curried function argument application
.stubs(stubMap)     // dependency injection — stubMap requires name property
.focus()            // on when() or base scenario — focuses test(s)
.ignore()           // on branch — ignores specific test
.assert(options?)   // registers test, optionally overrides runner config
```

The full chain grammar: `when → inState → hasInputs/andInputs → stubs → andUser(s)
→ expect → output | behaviors + sideEffects → assert`

## Naming requirements — enforced by the library

These cause a thrown error at registration time, not a warning:

- Anonymous stubs (no `name` property on stub object)
- Anonymous specs (anonymous function with no `.name`)
- Anonymous inputs (no `name` on input object when doc generation is needed)
- Any component passed to `when()` whose name cannot be derived

The intent is to push back against the JavaScript community's preference for
anonymous implementations. This is a feature, not a limitation.

## Reusable base scenarios — the core branching pattern

```javascript
// Build once — immutable
const userSubmitsForm = when(LoginForm).hasInputs(validCredentials);

// Branch in parallel — no suite() wrapper
userSubmitsForm.stubs(happyPath).expect.output(authenticated).assert();
userSubmitsForm.stubs(networkFailure).expect.behaviors(showsError).assert();
```

`when()` returns an immutable builder. Each branch is independent. No `suite()`
wrapper exists — grouping is automatic via internal `_baseId` shared between
branches from the same base. Do not add `suite()` — it was considered and
explicitly rejected.

## Focus and ignore

```javascript
when(Component).focus()              // focus all tests for this component
when(Component).hasInputs(x).focus() // focus all branches from this base
chain.ignore().expect...assert()     // ignore this specific branch
assert({ only: true })               // per-test override
```

Runner behavior: if any test has `focused: true`, only focused tests run.
CI protection: when `process.env.CI` is set and focused tests are present,
the runner throws by default (configurable: `focusInCIBehavior: 'warn'`).

## Reporter interface

Reporters receive structured events — not parsed strings. Every reporter
implements:

```javascript
class Reporter {
  onSuiteStart(suite)  {}
  onTestStart(test)    {}
  onTestPass(test)     {}
  onTestFail(test)     {}
  onTestSkip(test)     {}
  onSuiteEnd(suite)    {}
}
```

Doc generation output is derived from chain structure. Labels come from:
- component.name (or explicit label from when(fn, 'Label'))
- inputs.name property
- stubs.name property
- userAction.name property
- spec function.name or spec.name property

## Execution model

```javascript
// test.config.js
export default {
  execution:          'parallel',    // parallel | sequential | batch | immediate
  batchSize:          10,            // for batch mode
  timeout:            5000,
  retries:            0,
  focusInCIBehavior:  'error',       // 'warn' | 'error'
  reporters: [
    ['markdown', { output: './docs/spec.md' }],
    ['junit',    { output: './test-results/junit.xml' }],
    ['console']
  ]
};
```

Per-test overrides via `assert({ timeout, retries, parallel, sequential, skip, only })`.

## Coding conventions

- Plain JavaScript. No TypeScript in `@trysquare/core`. TypeScript support is
  `@trysquare/ts` only — type definitions, no runtime code.
- CommonJS throughout. `require`/`module.exports`. No ESM.
- 8-space real tabs. No spaces.
- Named functions everywhere. No anonymous functions as exports or callbacks
  that appear in stack traces.
- No inline comments explaining what code does. Comments explain *why*.
- `const` by default. `let` when reassignment needed. Never `var`.
- File naming: `kebab-case.js`
- Test files: `foo.test.js` co-located with source

## Open questions — resolve during implementation

These are documented in section 13 of the design document. The most important:

1. **Async spec support** — how does the library handle async assert functions?
   Does `.assert()` always return a Promise, or only when specs are async?
   Decision needed before first plugin implementation.

2. **Error reporting granularity** — when a test fails, which specific spec
   failed? The test object knows the test failed but not which of its specs
   caused the failure without running specs individually and tracking per-spec.
   Decision needed before reporter implementation.

3. **Test file discovery** — how does the runner find test files? Convention
   (`*.test.js`), explicit glob, or config-driven?

4. **Watch mode** — how does the runner handle file watching for local dev?

At each decision point, prefer the path that leaves more architectural flexibility.

## Build and test commands

```bash
# Install dependencies for all packages
npm install

# Run tests for a specific package
cd packages/core && npm test

# Run full test suite across all packages
npm run test:all

# Build all packages
npm run build

# Publish a package (after approval)
cd packages/core && npm publish --access public
```

## What Claude Code can do autonomously

- Write, edit, and refactor implementation code in any package
- Write tests using the trysquare API itself (the library tests itself)
- Run tests and fix failing tests
- Generate and update documentation from test output
- Resolve open questions from section 13 of the design document, documenting
  the decision in a comment before implementing
- Add named specs, stubs, and input objects
- Implement reporter output formatting

## What requires explicit approval

- Any change to the core fluent chain API (the `when/hasInputs/expect/assert`
  chain structure) — this is the public API and changes are breaking
- Any change to the Reporter interface (breaking for custom reporters)
- Adding a new package to the monorepo
- Changing the module format from CommonJS to ESM
- Publishing any package to npm
- Adding `"type": "module"` to any package.json
- Adding a `suite()` function — this was explicitly rejected in the design
- Adding TypeScript to `@trysquare/core` — TypeScript belongs in `@trysquare/ts`
- Introducing any runtime dependency in `@trysquare/core` — core must have
  zero runtime dependencies

## Things that will waste time — do not do these

- Do not add `suite()`. It was considered and rejected. Do not suggest it.
- Do not use `"type": "module"` in any package.json.
- Do not add TypeScript syntax to `@trysquare/core`.
- Do not use anonymous functions as top-level exports.
- Do not add runtime dependencies to `@trysquare/core` — it must remain
  zero-dependency.
- Do not claim `@trysquare/core` conflicts with existing npm packages — the
  `@trysquare` organization is registered and the scope is exclusively ours.
- Do not use `var`.
- Do not add nested describe/it wrappers — the fluent chain is the structure.
