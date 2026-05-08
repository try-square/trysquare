'use strict';

const React = require('react');

function ProductCard({ name, price, inStock, onAddToCart }) {
	return React.createElement('article', { 'aria-label': name },
		React.createElement('h2', null, name),
		React.createElement('p',  { 'data-testid': 'price' }, `$${price.toFixed(2)}`),
		inStock
			? React.createElement('button', { onClick: () => onAddToCart && onAddToCart({ name, price }) }, 'Add to cart')
			: React.createElement('span',   { 'aria-label': 'availability' }, 'Out of stock')
	);
}

ProductCard.displayName = 'ProductCard';
module.exports = { ProductCard };
