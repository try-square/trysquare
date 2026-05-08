'use strict';

const assert = require('node:assert/strict');
const { when } = require('@trysquare/core');
const { mount, withInputs, withStubs, userAction, states } = require('@trysquare/angular');
const { spy, wasCalledOnce, wasCalledWith, wasCalledFirst, wasCalledLast, wasNotCalled } = require('@trysquare/matchers');
const { TodoListComponent, TodoService } = require('./todo-list');

// ── Shows all items from service ──────────────────────────────────────────────

const twoItemService = {
	getAll()       { return [{ id: 1, text: 'Buy milk', completed: false }, { id: 2, text: 'Walk dog', completed: true }]; },
	getActive()    { return [{ id: 1, text: 'Buy milk', completed: false }]; },
	getCompleted() { return [{ id: 2, text: 'Walk dog', completed: true }]; },
	add:            spy('add (two-item)'),
	toggle:         spy('toggle (two-item)'),
	clearCompleted: spy('clearCompleted (two-item)'),
};

function showsTwoItems(fixture) {
	assert.strictEqual(fixture.componentInstance.items.length, 2);
}

function firstItemIsUncompleted(fixture) {
	assert.strictEqual(fixture.componentInstance.items[0].completed, false);
}

when(mount(TodoListComponent))
	.hasInputs(withInputs('filter: all', { filter: 'all' }))
	.stubs(withStubs('two-item service', {
		inject: [{ provide: TodoService, useValue: twoItemService }],
	}))
	.expect.output(showsTwoItems, firstItemIsUncompleted)
	.assert();

// ── Filter: active ────────────────────────────────────────────────────────────

function showsOneActiveItem(fixture) {
	assert.strictEqual(fixture.componentInstance.items.length, 1);
	assert.strictEqual(fixture.componentInstance.items[0].text, 'Buy milk');
}

when(mount(TodoListComponent))
	.hasInputs(withInputs('filter: active', { filter: 'active' }))
	.stubs(withStubs('two-item service', {
		inject: [{ provide: TodoService, useValue: twoItemService }],
	}))
	.expect.output(showsOneActiveItem)
	.assert();

// ── Filter: completed ─────────────────────────────────────────────────────────

function showsOneCompletedItem(fixture) {
	assert.strictEqual(fixture.componentInstance.items.length, 1);
	assert.strictEqual(fixture.componentInstance.items[0].text, 'Walk dog');
}

when(mount(TodoListComponent))
	.hasInputs(withInputs('filter: completed', { filter: 'completed' }))
	.stubs(withStubs('two-item service', {
		inject: [{ provide: TodoService, useValue: twoItemService }],
	}))
	.expect.output(showsOneCompletedItem)
	.assert();

// ── addItem calls service.add ─────────────────────────────────────────────────

const addService = {
	getAll()       { return []; },
	getActive()    { return []; },
	getCompleted() { return []; },
	add:            spy('service.add'),
	toggle:         spy('service.toggle'),
	clearCompleted: spy('service.clearCompleted'),
};

const typesNewItem = userAction('types and submits a new todo', async (fixture) => {
	fixture.componentInstance.addItem('Buy groceries');
});

function addCalledWithText(fixture) {
	wasCalledWith(addService.add, ['Buy groceries']).assert(fixture);
}

function addCalledOnce(fixture) {
	wasCalledOnce(addService.add).assert(fixture);
}

when(mount(TodoListComponent))
	.hasInputs(withInputs('empty list', { filter: 'all' }))
	.stubs(withStubs('spy service', {
		inject: [{ provide: TodoService, useValue: addService }],
	}))
	.andUser(typesNewItem)
	.expect.behaviors(addCalledOnce, addCalledWithText)
	.assert();

// ── toggle does not call add or clearCompleted ────────────────────────────────

const toggleService = {
	getAll()       { return [{ id: 7, text: 'Read book', completed: false }]; },
	getActive()    { return []; },
	getCompleted() { return []; },
	add:            spy('service.add (toggle test)'),
	toggle:         spy('service.toggle (toggle test)'),
	clearCompleted: spy('service.clearCompleted (toggle test)'),
};

const togglesFirstItem = userAction('clicks checkbox on item 7', async (fixture) => {
	fixture.componentInstance.toggleItem(7);
});

function toggleCalledWithId(fixture) {
	wasCalledWith(toggleService.toggle, [7]).assert(fixture);
}

function addNotCalledOnToggle(fixture) {
	wasNotCalled(toggleService.add).assert(fixture);
}

function clearNotCalledOnToggle(fixture) {
	wasNotCalled(toggleService.clearCompleted).assert(fixture);
}

when(mount(TodoListComponent))
	.hasInputs(withInputs('one item list', { filter: 'all' }))
	.stubs(withStubs('toggle spy service', {
		inject: [{ provide: TodoService, useValue: toggleService }],
	}))
	.andUser(togglesFirstItem)
	.expect.behaviors(toggleCalledWithId, addNotCalledOnToggle, clearNotCalledOnToggle)
	.assert();

// ── clearCompleted runs before refresh ───────────────────────────────────────
// Uses states.created to skip ngOnInit so only the user action's calls are tracked.

const clearSpy  = spy('service.clearCompleted (ordering)');
const getAllSpy  = spy('service.getAll (ordering)');

const orderingService = {
	getAll:         getAllSpy,
	getActive()    { return []; },
	getCompleted() { return []; },
	add:            spy('service.add (ordering)'),
	toggle:         spy('service.toggle (ordering)'),
	clearCompleted: clearSpy,
};

const clearsCompleted = userAction('clicks clear completed', async (fixture) => {
	fixture.componentInstance.clearCompleted();
});

function clearRunsBeforeRefresh(fixture) {
	wasCalledFirst(clearSpy, getAllSpy).assert(fixture);
}

function getAllCalledLast(fixture) {
	wasCalledLast(getAllSpy, clearSpy).assert(fixture);
}

when(mount(TodoListComponent))
	.inState(states.created)
	.hasInputs(withInputs('filter: all', { filter: 'all' }))
	.stubs(withStubs('ordering spy service', {
		inject: [{ provide: TodoService, useValue: orderingService }],
	}))
	.andUser(clearsCompleted)
	.expect.behaviors(clearRunsBeforeRefresh, getAllCalledLast)
	.assert();
