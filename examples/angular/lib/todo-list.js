'use strict';

class TodoService {
	constructor() {
		this._items  = [];
		this._nextId = 1;
	}

	getAll()       { return [...this._items]; }
	getActive()    { return this._items.filter(t => !t.completed); }
	getCompleted() { return this._items.filter(t => t.completed); }

	add(text) {
		this._items.push({ id: this._nextId++, text, completed: false });
	}

	toggle(id) {
		const item = this._items.find(t => t.id === id);
		if (item) item.completed = !item.completed;
	}

	clearCompleted() {
		this._items = this._items.filter(t => !t.completed);
	}
}

class TodoListComponent {
	constructor(todoService) {
		this.todoService = todoService;
		this.filter      = 'all';
		this.items       = [];
	}

	ngOnInit() {
		this.refresh();
	}

	refresh() {
		if (this.filter === 'active') {
			this.items = this.todoService.getActive();
		} else if (this.filter === 'completed') {
			this.items = this.todoService.getCompleted();
		} else {
			this.items = this.todoService.getAll();
		}
	}

	addItem(text) {
		this.todoService.add(text);
		this.refresh();
	}

	toggleItem(id) {
		this.todoService.toggle(id);
		this.refresh();
	}

	clearCompleted() {
		this.todoService.clearCompleted();
		this.refresh();
	}
}

// Declares injection order for the fixtureFactory DI resolution.
TodoListComponent.deps        = [TodoService];
TodoListComponent.displayName = 'TodoListComponent';

module.exports = { TodoListComponent, TodoService };
