# trysquare

A JavaScript testing library where the test chain is the specification. Tests generate documentation automatically — the description cannot drift from the behavior because they are the same object.

Named after the try square: a craftsman's tool for verifying work meets a known standard.

## The problem

In every major JavaScript test framework, test descriptions are arbitrary strings:

```js
describe('formatCurrency', () => {
    it('formats whole dollar amounts', () => {
        expect(formatCurrency(1000)).toBe('$1,000.00');
    });
});
```

The string `'formats whole dollar amounts'` has no enforced relationship to what is actually being tested. Over time, descriptions and behavior drift apart. Documentation generated from tests reflects what someone wrote, not what the code does.

## The solution

```js
const { when } = require('@trysquare/core');
const { equals } = require('@trysquare/matchers');
const { formatCurrency } = require('./format');

const wholeDollars = { name: 'whole dollar amount', value: 1000 };

when(formatCurrency).hasInputs(wholeDollars).expect.output(equals('$1,000.00')).assert();
```

The input name and matcher name are the same objects that drive assertions. When this test runs with `MarkdownReporter`, it writes:

```markdown
# formatCurrency

## whole dollar amount

**Output**
- ✓ equals "$1,000.00"
```

There are no strings to maintain separately. The documentation is generated from the verified specification.

## Installation

Install what your project needs — you don't need everything at once.

**Every project:**
```bash
npm install --save-dev @trysquare/core @trysquare/matchers
```

**Framework integrations (pick one):**
```bash
npm install --save-dev @trysquare/react
npm install --save-dev @trysquare/angular
```

**Documentation output:**
```bash
npm install --save-dev @trysquare/reporters   # test reports — JUnit, Markdown, HTML, PDF
npm install --save-dev @trysquare/docgen      # API reference docs
```

**TypeScript types:**
```bash
npm install --save-dev @trysquare/ts
```

**AI assistant context (no install required):**
```bash
npx @trysquare/ai init
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "trysquare"
  }
}
```

`trysquare` discovers all `*.test.js` files automatically. No runner setup, no test entry file.

## Writing tests

```js
// format.test.js
const { when } = require('@trysquare/core');
const { equals } = require('@trysquare/matchers');
const { formatCurrency } = require('./format');

const wholeDollars = { name: 'whole dollar amount', value: 1000   };
const withCents    = { name: 'amount with cents',   value: 10.5   };
const negative     = { name: 'negative amount',     value: -42.00 };

when(formatCurrency).hasInputs(wholeDollars).expect.output(equals('$1,000.00')).assert();
when(formatCurrency).hasInputs(withCents).expect.output(equals('$10.50')).assert();
when(formatCurrency).hasInputs(negative).expect.output(equals('-$42.00')).assert();
```

```bash
npm test
# 3 passed, 0 failed
```

## Branching

`when()` returns an immutable builder. Multiple branches from the same base are grouped automatically in generated output — no wrapper needed.

```js
const { when } = require('@trysquare/core');
const { equals } = require('@trysquare/matchers');
const { login } = require('./auth');

const validCredentials = { name: 'valid credentials', value: { user: 'alice', pass: 'secret' } };

const loginAttempt = when(login).hasInputs(validCredentials);

loginAttempt.stubs(successStubs).expect.output(equals({ token: 'abc123' })).assert();
loginAttempt.stubs(networkErrorStubs).expect.output(equals({ error: 'network unavailable' })).assert();
loginAttempt.stubs(badPasswordStubs).expect.output(equals({ error: 'invalid credentials' })).assert();
```

Generated output:

```markdown
# login

## valid credentials

### success

**Output**
- ✓ equals { token: "abc123" }

### network error

**Output**
- ✓ equals { error: "network unavailable" }

### bad password

**Output**
- ✓ equals { error: "invalid credentials" }
```

## Side effects

```js
const { when } = require('@trysquare/core');
const { equals, spy, wasCalledWith } = require('@trysquare/matchers');
const { createUser } = require('./users');

const send      = spy('send welcome email');
const mailer    = { name: 'mailer', send };
const newUser   = { name: 'new user', value: { email: 'alice@example.com' } };

when(createUser)
    .hasInputs(newUser)
    .stubs(mailer)
    .expect
    .output(equals({ created: true }))
    .sideEffects(wasCalledWith(send, [{ to: 'alice@example.com', subject: 'Welcome' }]))
    .assert();
```

Generated output:

```markdown
# createUser

## new user (mailer)

**Output**
- ✓ equals { created: true }

**Side effects**
- ✓ send welcome email was called with [{ to: "alice@example.com", subject: "Welcome" }]
```

## API documentation

`@trysquare/docgen` generates API reference documentation from the same test chains — Doxygen-style output that a developer consulting the docs can actually use, not a pass/fail test report.

Add optional annotations to the chain:

```js
const { when } = require('@trysquare/core');
const { equals, spy, wasCalledWith } = require('@trysquare/matchers');
const { createUser } = require('./users');

const send   = spy('send welcome email');
const mailer = { name: 'mailer', send };

const newUser = {
    name:        'new user',
    value:       { email: 'alice@example.com' },
    type:        'UserInput',                           // optional — type annotation
    description: 'Must have a valid email address.',    // optional — parameter description
};

when(createUser, { description: 'Creates a user and sends a welcome email.' })
    .hasInputs(newUser)
    .stubs(mailer)
    .expect
    .output(equals({ created: true }))
    .sideEffects(wasCalledWith(send, [{ to: 'alice@example.com', subject: 'Welcome' }]))
    .assert();
```

Wire `DocumentGenerator` into `test.config.js` alongside your test reporters:

```js
// test.config.js
const { DocumentGenerator } = require('@trysquare/docgen');

module.exports = {
    execution: 'parallel',
    timeout: 5000,
    reporters: [
        ['console'],
        ['junit', { output: './test-results/junit.xml' }],
        new DocumentGenerator({
            output: './docs',
            format: 'html',        // 'html' | 'markdown' | 'both'
            types:  'infer',       // 'infer' | 'explicit' | 'typescript'
        }),
    ],
};
```

`npm test` now produces both test output and an `index.html` API reference in `./docs`. The two are independent — CI reads the test output, developers consult the docs.

Example generated API reference (markdown format):

```markdown
# formatCurrency

Formats a numeric amount as a localized currency string.

## whole dollar amount

**Parameters**
- `whole dollar amount` `number` `1000` — Rounds to 2 decimal places.

**Returns**
- `string` equals "$1,000.00"

## amount with cents

**Returns**
- `string` equals "$10.50"

---

# login

Authenticates a user and returns a session token.

## valid credentials

### success

**Returns**
- `object` equals {"token":"abc123"}

### network error

**Returns**
- `object` equals {"error":"network unavailable"}

---

# createUser

Creates a user record and sends a welcome email.

## new user (mailer)

**Parameters**
- `new user` `UserInput` `{"email":"alice@example.com"}` — Must have a valid email address.

**Returns**
- `object` equals {"created":true}

**Side effects**
- send welcome email was called with [{"to":"alice@example.com","subject":"Welcome"}]
```

Every line in that output is derived from a passing assertion. Nothing is written by hand.

Install `@trysquare/reporters` for markdown, HTML, PDF, and JUnit test output reporters.

## Packages

| Package | Description |
|---------|-------------|
| [`@trysquare/core`](packages/core) | Foundation — runner, fluent chain, no framework dependencies |
| [`@trysquare/matchers`](packages/matchers) | `equals`, `includes`, `wasCalled`, `wasCalledWith`, and more |
| [`@trysquare/reporters`](packages/reporters) | Test output reporters — Markdown, HTML, PDF, JUnit, console |
| [`@trysquare/docgen`](packages/docgen) | API documentation generator — produces verified reference docs from test chains |
| [`@trysquare/react`](packages/react) | React lifecycle extensions |
| [`@trysquare/angular`](packages/angular) | Angular DI + lifecycle extensions |
| [`@trysquare/factories`](packages/factories) | Helpers for building named scenario inputs |
| [`@trysquare/ts`](packages/ts) | TypeScript type definitions |
| [`@trysquare/ai`](packages/ai) | AI assistant context for Claude Code, Cursor, Copilot, Windsurf, and others |

## AI assistant support

Most AI coding assistants will default to writing `describe`/`it` blocks that don't exist in trysquare. Run this once after installing:

```bash
npx @trysquare/ai init
```

Writes trysquare API context to your tool's config file — auto-detects Claude Code, Cursor, GitHub Copilot, Windsurf, and OpenAI Codex.

## Development

```bash
npm install       # install all workspace dependencies
npm test          # run tests across all packages
```

Releases are managed with [Changesets](https://github.com/changesets/changesets).

## License

MIT
