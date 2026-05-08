'use strict';

const { when } = require('@trysquare/core');
const {
	deepEquals,
	wasCalledFirst, wasCalledLast,
	wasCalledWith, wasCalledTimes,
} = require('@trysquare/matchers');
const { spy } = require('@trysquare/matchers');
const { input } = require('@trysquare/factories');
const { createOrder, cancelOrder } = require('./order-service');

// ── createOrder ───────────────────────────────────────────────────────────────
// Demonstrates: wasCalledFirst/wasCalledLast for full pipeline ordering

const createLogger = spy('order logger');
const mockDb       = spy('database', () => ({ id: 'ord-1', total: 99.99, status: 'pending' }));
const mockEvents   = spy('event bus', () => undefined);

when(createOrder)
	.hasInputs({
		name:   'new order',
		data:   { items: [{ sku: 'ABC', qty: 2 }], total: 99.99 },
		db:     { insert: mockDb },
		events: { emit: mockEvents },
		logger: createLogger,
	})
	.expect.output(
		deepEquals({ id: 'ord-1', total: 99.99, status: 'pending' }),
		wasCalledFirst(createLogger, mockDb, mockEvents),
		wasCalledWith(mockDb,     ['orders', { items: [{ sku: 'ABC', qty: 2 }], total: 99.99 }]),
		wasCalledWith(mockEvents, ['order.created', { id: 'ord-1', total: 99.99 }])
	)
	.assert();

// ── cancelOrder — pending order ───────────────────────────────────────────────

const cancelLogger   = spy('order logger');
const cancelDbFind   = spy('db.findOne', () => ({ id: 'ord-2', status: 'pending' }));
const cancelDbUpdate = spy('db.update',  () => undefined);
const cancelEvents   = spy('event bus',  () => undefined);

when(cancelOrder)
	.hasInputs({
		name:   'pending order cancellation',
		id:     'ord-2',
		db:     { findOne: cancelDbFind, update: cancelDbUpdate },
		events: { emit: cancelEvents },
		logger: cancelLogger,
	})
	.expect.output(
		deepEquals({ id: 'ord-2', status: 'cancelled' }),
		wasCalledFirst(cancelLogger, cancelDbFind, cancelDbUpdate, cancelEvents),
		wasCalledLast(cancelEvents, cancelLogger, cancelDbFind, cancelDbUpdate),
		wasCalledWith(cancelDbUpdate, ['orders', { id: 'ord-2' }, { status: 'cancelled' }]),
		wasCalledWith(cancelEvents,   ['order.cancelled', { id: 'ord-2' }]),
		wasCalledTimes(cancelLogger, 2)
	)
	.assert();
