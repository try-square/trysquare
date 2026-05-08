'use strict';

async function createOrder({ data, db, events, logger }) {
	logger('creating order');
	const order = await db.insert('orders', data);
	await events.emit('order.created', { id: order.id, total: order.total });
	logger(`order ${order.id} created`);
	return order;
}

async function cancelOrder({ id, db, events, logger }) {
	logger(`cancelling order ${id}`);
	const order = await db.findOne('orders', { id });
	if (!order) throw new Error(`Order ${id} not found`);
	if (order.status === 'shipped') throw new Error(`Order ${id} cannot be cancelled after shipping`);
	await db.update('orders', { id }, { status: 'cancelled' });
	await events.emit('order.cancelled', { id });
	logger(`order ${id} cancelled`);
	return { id, status: 'cancelled' };
}

module.exports = { createOrder, cancelOrder };
