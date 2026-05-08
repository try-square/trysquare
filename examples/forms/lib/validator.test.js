'use strict';

const { when } = require('@trysquare/core');
const { equals, deepEquals } = require('@trysquare/matchers');
const { input, factory } = require('@trysquare/factories');
const { validateEmail, validatePassword, validateForm } = require('./validator');

// Named selectors improve spec names in reporter output
function valid(r)    { return r.valid;    }
function error(r)    { return r.error;    }
function strength(r) { return r.strength; }
function errors(r)   { return r.errors;   }

const makeEmail = factory();

// ── validateEmail ─────────────────────────────────────────────────────────────

when(validateEmail)
	.hasInputs(makeEmail('standard email', { email: 'user@example.com' }))
	.expect.output(equals(true, valid))
	.assert();

when(validateEmail)
	.hasInputs(makeEmail('subdomain email', { email: 'user@mail.example.co.uk' }))
	.expect.output(equals(true, valid))
	.assert();

when(validateEmail)
	.hasInputs(makeEmail('missing domain', { email: 'user@' }))
	.expect.output(
		equals(false, valid),
		equals('Invalid email address', error)
	)
	.assert();

when(validateEmail)
	.hasInputs(makeEmail('missing @ symbol', { email: 'notanemail' }))
	.expect.output(equals(false, valid))
	.assert();

when(validateEmail)
	.hasInputs(makeEmail('empty string', { email: '' }))
	.expect.output(
		equals(false, valid),
		equals('Email is required', error)
	)
	.assert();

when(validateEmail)
	.hasInputs(makeEmail('@ at start', { email: '@example.com' }))
	.expect.output(equals(false, valid))
	.assert();

// ── validatePassword ──────────────────────────────────────────────────────────

when(validatePassword)
	.hasInputs(input('short password', { password: 'abc' }))
	.expect.output(
		equals(false, valid),
		equals('weak', strength),
		equals('Password must be at least 8 characters', error)
	)
	.assert();

when(validatePassword)
	.hasInputs(input('exactly 8 characters', { password: 'exactly8' }))
	.expect.output(
		equals(true, valid),
		equals('medium', strength)
	)
	.assert();

when(validatePassword)
	.hasInputs(input('12+ character passphrase', { password: 'correct-horse-battery' }))
	.expect.output(
		equals(true, valid),
		equals('strong', strength)
	)
	.assert();

when(validatePassword)
	.hasInputs(input('empty password', { password: '' }))
	.expect.output(
		equals(false, valid),
		equals('Password is required', error)
	)
	.assert();

// ── validateForm ──────────────────────────────────────────────────────────────

when(validateForm)
	.hasInputs(input('all fields valid', { email: 'alice@example.com', password: 'securepassword' }))
	.expect.output(
		equals(true, valid),
		deepEquals([], errors)
	)
	.assert();

when(validateForm)
	.hasInputs(input('both fields invalid', { email: 'bad', password: 'short' }))
	.expect.output(
		equals(false, valid),
		deepEquals(['Invalid email address', 'Password must be at least 8 characters'], errors)
	)
	.assert();

when(validateForm)
	.hasInputs(input('only email invalid', { email: '', password: 'goodpassword1' }))
	.expect.output(
		equals(false, valid),
		deepEquals(['Email is required'], errors)
	)
	.assert();

when(validateForm)
	.hasInputs(input('only password invalid', { email: 'user@example.com', password: 'weak' }))
	.expect.output(
		equals(false, valid),
		deepEquals(['Password must be at least 8 characters'], errors)
	)
	.assert();
