'use strict';

const assert = require('node:assert/strict');
const { fireEvent } = require('@testing-library/react');
const { when }      = require('@trysquare/core');
const { mount, withProps, userAction } = require('@trysquare/react');
const { spy, wasCalledOnce, wasCalledWith } = require('@trysquare/matchers');
const { ProductCard } = require('./product-card');

// ── In-stock product ──────────────────────────────────────────────────────────

function showsProductName(screen) {
	screen.getByRole('heading', { name: 'Running Shoes' });
}

function showsPrice(screen) {
	assert.ok(screen.getByTestId('price').textContent.includes('89.99'));
}

function showsAddToCartButton(screen) {
	screen.getByRole('button', { name: 'Add to cart' });
}

const inStockBase = when(mount(ProductCard))
	.hasInputs(withProps('running shoes in stock', {
		name:    'Running Shoes',
		price:   89.99,
		inStock: true,
	}));

inStockBase.expect.output(showsProductName, showsPrice, showsAddToCartButton).assert();

// ── Out-of-stock product ──────────────────────────────────────────────────────

function showsOutOfStock(screen) {
	screen.getByLabelText('availability');
	assert.ok(screen.queryByRole('button') === null);
}

when(mount(ProductCard))
	.hasInputs(withProps('sold out product', {
		name:    'Vintage Watch',
		price:   249.00,
		inStock: false,
	}))
	.expect.output(showsOutOfStock)
	.assert();

// ── Add to cart interaction ───────────────────────────────────────────────────

const mockAddToCart = spy('add to cart handler');

const clicksAddToCart = userAction('clicks add to cart', async (screen) => {
	fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
});

function callsAddToCartWithProduct(screen) {
	wasCalledWith(mockAddToCart, [{ name: 'Trail Boots', price: 129.99 }]).assert(screen);
}

when(mount(ProductCard))
	.hasInputs(withProps('in-stock product with handler', {
		name:        'Trail Boots',
		price:       129.99,
		inStock:     true,
		onAddToCart: mockAddToCart,
	}))
	.andUser(clicksAddToCart)
	.expect.behaviors(callsAddToCartWithProduct)
	.assert();
