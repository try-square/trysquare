'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { mount, isMount, MOUNT_FLAG } = require('./mount');

function catching(fn) {
	try { fn(); return null; }
	catch (err) { return err; }
}

function ArrowComponent() {}
ArrowComponent.displayName = 'ArrowComponent';

function mountValidation(_) {
	return {
		stringThrow: catching(() => mount('not a function')),
		nullThrow:   catching(() => mount(null)),
		objectThrow: catching(() => mount({})),
	};
}

function mountValidationCorrect(r) {
	assert.match(r.stringThrow.message, /requires a React component/);
	assert.match(r.nullThrow.message,   /requires a React component/);
	assert.match(r.objectThrow.message, /requires a React component/);
}

when(mountValidation)
	.hasInputs({ name: 'mount() validation', value: null })
	.expect.output(mountValidationCorrect)
	.assert();

function mountProperties(_) {
	function MyButton() {}
	const wrapper = mount(MyButton);
	const arrowWrapper = mount(ArrowComponent);
	return {
		name:         wrapper.name,
		displayName:  arrowWrapper.name,
		mountFlag:    wrapper[MOUNT_FLAG] === MyButton,
		directThrow:  catching(() => wrapper()),
	};
}

function mountPropertiesCorrect(r) {
	assert.strictEqual(r.name, 'MyButton');
	assert.strictEqual(r.displayName, 'ArrowComponent');
	assert.strictEqual(r.mountFlag, true);
	assert.match(r.directThrow.message, /setupReactRunner/);
}

when(mountProperties)
	.hasInputs({ name: 'mount() properties', value: null })
	.expect.output(mountPropertiesCorrect)
	.assert();

function isMountBehavior(_) {
	function MyButton() {}
	const wrapper = mount(MyButton);
	return {
		trueForWrapper: isMount(wrapper),
		falseForPlain:  isMount(MyButton),
		falseForArrow:  isMount(() => {}),
		falseForNull:   isMount(null),
	};
}

function isMountBehaviorCorrect(r) {
	assert.strictEqual(r.trueForWrapper, true);
	assert.strictEqual(r.falseForPlain,  false);
	assert.strictEqual(r.falseForArrow,  false);
	assert.strictEqual(r.falseForNull,   false);
}

when(isMountBehavior)
	.hasInputs({ name: 'isMount() behavior', value: null })
	.expect.output(isMountBehaviorCorrect)
	.assert();
