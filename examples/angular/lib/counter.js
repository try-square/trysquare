'use strict';

class CounterComponent {
	constructor() {
		this.count          = 0;
		this.step           = 1;
		this.onCountChange  = null;
	}

	increment() {
		this.count += this.step;
		if (this.onCountChange) this.onCountChange(this.count);
	}

	decrement() {
		this.count -= this.step;
		if (this.onCountChange) this.onCountChange(this.count);
	}

	reset() {
		this.count = 0;
		if (this.onCountChange) this.onCountChange(this.count);
	}
}

CounterComponent.displayName = 'CounterComponent';
module.exports = { CounterComponent };
