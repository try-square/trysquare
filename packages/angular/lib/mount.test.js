'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { mount, isMount, MOUNT_FLAG } = require('./mount');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function mountValidation(_) {
	return {
		stringThrow: catching(() => mount('not a function')),
		nullThrow:   catching(() => mount(null)),
		numberThrow: catching(() => mount(42)),
	};
}

function mountValidationCorrect(r) {
	assert.match(r.stringThrow.message, /requires an Angular component class/);
	assert.match(r.nullThrow.message,   /requires an Angular component class/);
	assert.match(r.numberThrow.message, /requires an Angular component class/);
}

when(mountValidation)
	.hasInputs({ name: 'mount() validation', value: null })
	.expect.output(mountValidationCorrect)
	.assert();

function mountProperties(_) {
	function MyComponent() {}
	const wrapper = mount(MyComponent);
	return {
		name:        wrapper.name,
		mountFlag:   wrapper[MOUNT_FLAG] === MyComponent,
		directThrow: catching(() => wrapper()),
	};
}

function mountPropertiesCorrect(r) {
	assert.strictEqual(r.name, 'MyComponent');
	assert.strictEqual(r.mountFlag, true);
	assert.match(r.directThrow.message, /setupAngularRunner/);
}

when(mountProperties)
	.hasInputs({ name: 'mount() properties', value: null })
	.expect.output(mountPropertiesCorrect)
	.assert();

function isMountBehavior(_) {
	function MyComponent() {}
	const wrapper = mount(MyComponent);
	return {
		trueForWrapper:    isMount(wrapper),
		falseForPlain:     isMount(MyComponent),
		falseForArrow:     isMount(() => {}),
		falseForNull:      isMount(null),
		falseForUndefined: isMount(undefined),
	};
}

function isMountBehaviorCorrect(r) {
	assert.strictEqual(r.trueForWrapper,    true);
	assert.strictEqual(r.falseForPlain,     false);
	assert.strictEqual(r.falseForArrow,     false);
	assert.strictEqual(r.falseForNull,      false);
	assert.strictEqual(r.falseForUndefined, false);
}

when(isMountBehavior)
	.hasInputs({ name: 'isMount() behavior', value: null })
	.expect.output(isMountBehaviorCorrect)
	.assert();
