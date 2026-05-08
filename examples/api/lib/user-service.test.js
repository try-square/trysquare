'use strict';

const { when } = require('@trysquare/core');
const { deepEquals, wasCalledBefore, wasCalledWith, wasCalledTimes } = require('@trysquare/matchers');
const { spy, returns } = require('@trysquare/matchers');
const { getUser, fetchWithRetry } = require('./user-service');

// ── getUser — successful fetch ────────────────────────────────────────────────
// Demonstrates: async component, logger called before http

const fetchLogger = spy('request logger');
const successHttp = spy('http client', () => ({
	ok:   true,
	body: { id: 'u-1', name: 'Alice', role: 'admin' },
}));

when(getUser)
	.hasInputs({
		name:   'existing user request',
		id:     'u-1',
		http:   successHttp,
		logger: fetchLogger,
	})
	.expect.output(
		deepEquals({ id: 'u-1', name: 'Alice', role: 'admin' }),
		wasCalledBefore(fetchLogger, successHttp),
		wasCalledWith(fetchLogger, ['fetching user u-1']),
		wasCalledWith(successHttp,  ['/users/u-1'])
	)
	.assert();

// ── fetchWithRetry — 503 twice then success ───────────────────────────────────
// Demonstrates: returns() feeding controlled responses across multiple calls

const retryHttp = spy('http client', returns(
	{ ok: false, status: 503 },
	{ ok: false, status: 503 },
	{ ok: true,  body: { id: 'u-2', name: 'Bob' } }
));

when(fetchWithRetry)
	.hasInputs({
		name:        '503 twice then success',
		url:         '/users/u-2',
		http:        retryHttp,
		maxAttempts: 3,
	})
	.expect.output(
		deepEquals({ id: 'u-2', name: 'Bob' }),
		wasCalledTimes(retryHttp, 3)
	)
	.assert();

// ── fetchWithRetry — succeeds on first attempt ────────────────────────────────

const fastHttp = spy('http client', returns({ ok: true, body: { id: 'u-3' } }));

when(fetchWithRetry)
	.hasInputs({
		name:        'succeeds immediately',
		url:         '/users/u-3',
		http:        fastHttp,
		maxAttempts: 3,
	})
	.expect.output(
		deepEquals({ id: 'u-3' }),
		wasCalledTimes(fastHttp, 1)
	)
	.assert();
