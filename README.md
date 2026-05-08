# trysquare

A JavaScript testing library where the test chain is the specification. Tests generate documentation automatically — the description cannot drift from the behavior because they are the same object.

Named after the try square: a craftsman's tool for verifying work meets a known standard.

## The problem

In every major JavaScript test framework, test descriptions are arbitrary strings:

```js
describe('formatDate', () => {
    it('formats a timestamp correctly', () => { ... });
});
```

The string `'formats a timestamp correctly'` has no enforced relationship to what is actually being tested. Documentation generated from these tests reflects what a developer wrote, not a verified specification of behavior. Over time, descriptions and code drift apart.

## The solution

```js
when(formatDate).hasInputs(unixTimestamp).expect.output(formatsAsISO8601).assert();
```

The chain is structured data, not a string. The label in generated docs comes from `formatsAsISO8601.name` — the same function that verifies the behavior. They cannot drift because they are the same artifact.

## Quick start

```bash
npm install @trysquare/core
```

```js
// math.test.js
const assert = require('node:assert');
const { Runner, makeWhen } = require('@trysquare/core');
const { double } = require('./math');

const runner = new Runner();
const when = makeWhen(runner);

const smallNumber = { name: 'small number', value: 4 };

function doublesTheInput(result) {
    assert.strictEqual(result, 8);
}

when(double).hasInputs(smallNumber).expect.output(doublesTheInput).assert();

module.exports = runner;
```

```js
// run-tests.js
const runner = require('./math.test');

runner.run().then(suite => {
    console.log(`${suite.passed} passed, ${suite.failed} failed`);
    if (suite.failed > 0) process.exit(1);
});
```

```bash
node run-tests.js
# 1 passed, 0 failed
```

## Branching

`when()` returns an immutable builder. Multiple branches from the same base are grouped automatically in output — no `suite()` wrapper needed.

```js
const loginAttempt = when(LoginForm).hasInputs(validCredentials);

loginAttempt.stubs(happyPath).expect.output(authenticatesUser).assert();
loginAttempt.stubs(networkError).expect.output(showsErrorMessage).assert();
loginAttempt.stubs(badPassword).expect.output(showsPasswordError).assert();
```

## Packages

| Package | Description |
|---------|-------------|
| [`@trysquare/core`](packages/core) | Foundation — runner, fluent chain, no framework dependencies |
| [`@trysquare/react`](packages/react) | React lifecycle extensions |
| [`@trysquare/angular`](packages/angular) | Angular DI + lifecycle extensions |
| [`@trysquare/reporters`](packages/reporters) | Markdown, HTML, PDF, JUnit, and console reporters |
| [`@trysquare/factories`](packages/factories) | Helpers for building named scenario inputs |
| [`@trysquare/matchers`](packages/matchers) | Named spec matchers |
| [`@trysquare/ts`](packages/ts) | TypeScript type definitions |
| [`@trysquare/ai`](packages/ai) | AI assistant context for Claude Code, Cursor, Copilot, Windsurf, and others |

## AI assistant support

If you use an AI coding assistant, run this once in your project after installing trysquare:

```bash
npx @trysquare/ai init
```

This writes trysquare API context to your tool's config file (auto-detected). Supports Claude Code, Cursor, GitHub Copilot, Windsurf, and OpenAI Codex. Without it, most AI tools will default to writing `describe`/`it` blocks that don't belong here.

## Development

```bash
# Install all workspace dependencies
npm install

# Run tests across all packages
npm test

# Run tests for a single package
cd packages/core && npm test
```

Releases are managed with [Changesets](https://github.com/changesets/changesets).

## License

MIT
