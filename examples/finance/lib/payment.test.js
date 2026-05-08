'use strict';

const { when } = require('@trysquare/core');
const { deepEquals, wasCalledTimes, wasCalledWith, wasCalledFirst, wasCalledLast, wasNotCalled } = require('@trysquare/matchers');
const { spy } = require('@trysquare/matchers');
const { processPayment } = require('./payment');

// ── Approved payment ──────────────────────────────────────────────────────────
// Demonstrates: spy matchers, wasCalledFirst/wasCalledLast, call ordering

const approvedGateway = spy('payment gateway', () => ({ success: true, transactionId: 'txn-001' }));
const successLogger   = spy('audit logger');
const successRecorder = spy('result recorder');

when(processPayment)
	.hasInputs({
		name:     'approved card payment',
		amount:   99.99,
		card:     { number: '4111111111111111', exp: '12/26' },
		gateway:  approvedGateway,
		logger:   successLogger,
		recorder: successRecorder,
	})
	.expect.output(
		deepEquals({ success: true, transactionId: 'txn-001' }),
		wasCalledTimes(successLogger, 1),
		wasCalledWith(successLogger, ['Processing payment of $99.99']),
		wasCalledFirst(successLogger, approvedGateway, successRecorder),
		wasCalledLast(successRecorder, successLogger, approvedGateway)
	)
	.assert();

// ── Declined payment ──────────────────────────────────────────────────────────
// Logger is called twice (before and after the failure), recorder still runs

const declinedGateway = spy('payment gateway', () => ({ success: false, error: 'card declined' }));
const failLogger      = spy('audit logger');
const failRecorder    = spy('result recorder');

when(processPayment)
	.hasInputs({
		name:     'declined card payment',
		amount:   150,
		card:     { number: '4000000000000002', exp: '12/26' },
		gateway:  declinedGateway,
		logger:   failLogger,
		recorder: failRecorder,
	})
	.expect.output(
		deepEquals({ success: false, error: 'card declined' }),
		wasCalledTimes(failLogger, 2),
		wasCalledWith(failLogger, ['Processing payment of $150']),
		wasCalledWith(failLogger, ['Payment failed: card declined']),
		wasCalledFirst(failLogger, declinedGateway, failRecorder)
	)
	.assert();

// ── Zero-amount payment — gateway is never called ─────────────────────────────
// Demonstrates wasNotCalled for verification of absent behaviour

function rejectsZero({ amount, card, gateway, logger, recorder }) {
	if (!amount || amount <= 0) {
		logger('rejected: invalid amount');
		recorder({ success: false, error: 'invalid amount' });
		return { success: false, error: 'invalid amount' };
	}
	return processPayment({ amount, card, gateway, logger, recorder });
}

const zeroGateway  = spy('payment gateway');
const zeroLogger   = spy('audit logger');
const zeroRecorder = spy('result recorder');

when(rejectsZero)
	.hasInputs({
		name:     'zero amount payment',
		amount:   0,
		card:     { number: '4111111111111111' },
		gateway:  zeroGateway,
		logger:   zeroLogger,
		recorder: zeroRecorder,
	})
	.expect.output(
		deepEquals({ success: false, error: 'invalid amount' }),
		wasNotCalled(zeroGateway),
		wasCalledWith(zeroLogger, ['rejected: invalid amount'])
	)
	.assert();
