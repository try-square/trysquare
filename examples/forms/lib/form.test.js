'use strict';

const { when } = require('@trysquare/core');
const {
	deepEquals,
	wasCalledBefore, wasCalledAfter,
	wasCalledFirst, wasCalledLast,
	wasNotCalled, wasCalledWith,
} = require('@trysquare/matchers');
const { spy } = require('@trysquare/matchers');
const { submitForm } = require('./form');

// ── Successful registration ───────────────────────────────────────────────────
// Demonstrates: call ordering (logger before api, analytics last for success event)

const successApi       = spy('registration api', () => ({ success: true, userId: 'u-42' }));
const successAnalytics = spy('analytics tracker');
const successLogger    = spy('form logger');

when(submitForm)
	.hasInputs({
		name:      'valid registration',
		email:     'alice@example.com',
		password:  'supersecurepassword',
		api:       { post: successApi },
		analytics: successAnalytics,
		logger:    successLogger,
	})
	.expect.output(
		deepEquals({ success: true, userId: 'u-42' }),
		wasCalledFirst(successLogger, successApi, successAnalytics),
		wasCalledBefore(successAnalytics, successApi),
		wasCalledWith(successLogger, ['form submission started']),
		wasCalledWith(successAnalytics, ['form_submit_success', { email: 'alice@example.com' }])
	)
	.assert();

// ── Validation failure — api is never called ──────────────────────────────────
// Demonstrates: wasNotCalled prevents accidental side effects leaking through

const failApi       = spy('registration api');
const failAnalytics = spy('analytics tracker');
const failLogger    = spy('form logger');

when(submitForm)
	.hasInputs({
		name:      'invalid registration attempt',
		email:     'notvalid',
		password:  'short',
		api:       { post: failApi },
		analytics: failAnalytics,
		logger:    failLogger,
	})
	.expect.output(
		deepEquals({ success: false, errors: ['Invalid email address', 'Password must be at least 8 characters'] }),
		wasNotCalled(failApi),
		wasCalledAfter(failAnalytics, failLogger),
		wasCalledWith(failAnalytics, ['form_validation_failed', {
			errors: ['Invalid email address', 'Password must be at least 8 characters'],
		}])
	)
	.assert();
