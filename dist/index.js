'use strict';

/**
 * A class that extends Set with partial implementations of common Array
 * methods like .map() .filter(), etc.
 */
class Collection extends Set {

	/**
	 * The map() method creates a new Collection with the results of calling
	 * a provided function on every element in the calling Collection.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
	 *
	 * @param {function} callback - Function that produces an element of the new Collection.
	 * @returns {Collection} - A new Collection (or subclass) with each element being the result of the callback function.
	 */
	map(callback) {
		const Clazz = this.constructor; // In case Collection gets extended
		const newSet = new Clazz();
		this.forEach(item => newSet.add(callback(item)));
		return newSet
	}

	/**
	 * The filter() method creates a new Collection with all elements that pass the
	 * test implemented by the provided function.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
	 *
	 * @param {function} callback - Function used to test each element of the Collection.
	 *     Return true to keep the element, false otherwise.
	 * @returns {Collection} - Collection (or subclass) holding filtered results.
	 */
	filter(callback) {
		const Clazz = this.constructor;
		const newSet = new Clazz();
		this.forEach(item => { if (callback(item)) newSet.add(item); });
		return newSet
	}

	/**
	 * The reduce() method applies a function against an accumulator
	 * and each element in the Collection (from left to right) to reduce
	 * it to a single value.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
	 *
	 * @param {function} callback - Function to execute on each element in the Collection.
	 * @param {*} [initialValue] - Value to use as the first argument to the first call of the callback.
	 *     If no initial value is supplied, the first element in the Collection will be used.
	 *     Calling reduce() on an empty Collection without an initial value is an error.
	 * @returns {*} - The value that results from the reduction.
	 */
	reduce(callback, initialValue) {
		if (initialValue === undefined && this.size === 0)
			throw new Error('reduce() cannot be called on an empty set')

		const iterator = this.values();
		let lastVal = initialValue === undefined ? iterator.next().value : initialValue;
		for (const item of iterator) {
			lastVal = callback(lastVal, item);
		}
		return lastVal
	}

	/**
	 * The some() method tests whether at least one element in the Collection passes
	 * the test implemented by the provided function.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
	 *
	 * @param {function} callback - Function to test for each element.
	 * @returns {boolean} - True if the callback function returns a truthy value for any Collection element; otherwise, false.
	 */
	some(callback) {
		for (const item of this) {
			if (callback(item)) return true
		}
		return false
	}

	/**
	 * The every() method tests whether all elements in the Collection pass the
	 * test implemented by the provided function.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
	 *
	 * @param {function} callback - Function to test for each element.
	 * @returns {boolean} - True if the callback function returns a truthy value for every Collection element; otherwise, false.
	 */
	every(callback) {
		for (const item of this) {
			if (!callback(item)) return false
		}
		return true
	}

	/**
	 * The find() method returns the value of the first element in the Collection
	 * that satisfies the provided testing function. Otherwise undefined is returned.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	 *
	 * @param {function} callback - Function to execute on each value in the Collection.
	 * @returns {*} - A value in the Collection if an element passes the test; otherwise, undefined.
	 */
	find(callback) {
		for (const item of this) {
			if (callback(item)) return item
		}
		return undefined
	}

	/**
	 * The concat() method is used to merge two or more iterable objects.
	 * This method does not change the existing iterables, but instead
	 * returns a new Collection.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
	 *
	 * @param {...Iterable.<*>} - iterable to concatenate into a new Collection.
	 * @returns {Collection} - A new Collection (or subclass) instance.
	 */
	concat(...iterables) {
		const Clazz = this.constructor; // In case Collection gets extended
		const newSet = new Clazz(this);
		for (const iterable of iterables) {
			for (const item of iterable) {
				newSet.add(item);
			}
		}
		return newSet
	}
}

/**
 * Module containing the GameEvent constructor and eventTargetMixin.
 * @module GameEvent
 */

const _GameEvent = new WeakMap();
let propagatingEvent = null; // Keeps track of the currently propagating event to cancel out duplicate events

/**
 * Class representing an event fired by a game object. (API based on web standards)
 */
class GameEvent {
	constructor(type, { bubbles } = {}) {
		const _this = {
			target: null,
			currentTarget: null,
			propagateImmediate: true,
			propagate: !!bubbles,
		};
		_GameEvent.set(this, _this);

		this.timestamp = null;
		Object.defineProperty(this, 'type', { value: type, writable: false });
		Object.defineProperty(this, 'bubbles', { value: !!bubbles, writable: false });
		Object.defineProperty(this, 'target', { get() { return _this.target } });
		Object.defineProperty(this, 'currentTarget', { get() { return _this.currentTarget } });
	}

	/**
	 * Prevents further propagation of the current event.
	 * @returns {this} - Returns self for method chaining.
	 */
	stopPropagation() {
		_GameEvent.get(this).propagate = false;
		return this
	}

	/**
	 * Prevents other listeners of the same event from being called.
	 * @returns {this} - Returns self for method chaining.
	 */
	stopImmediatePropagation() {
		const _this = _GameEvent.get(this);
		_this.propagate = false;
		_this.propagateImmediate = false;
		return this
	}
}

const _eventTargetMixin = new WeakMap();

/**
 * Event Target mixin
 *
 * This provides properties and methods used for game event handling.
 *
 * @mixin eventTargetMixin
 */
const eventTargetMixin = {
	construct() {
		_eventTargetMixin.set(this, {
			listeners: new Map(),
			listenerOptions: new WeakMap(),
			parent: null,
		});
	},

	/**
	 * Dispatches an Event to the specified EventTarget, asynchronously invoking
	 * the affected EventListeners in the appropriate order.
	 *
	 * @async
	 * @param {GameEvent} e - Event to dispatch.
	 */
	async dispatchEventAsync(e) {
		// TODO: DRY this up by using shared code between this and .dispatchEvent()

		// Prevent duplicate events during propagation
		if (propagatingEvent && propagatingEvent.currentTarget === this) return

		const _this = _eventTargetMixin.get(this);
		const _event = _GameEvent.get(e);

		// Modify event's private properties
		if (_event.target === null) {
			_event.timestamp = performance.now();
			_event.target = this;
		}
		_event.currentTarget = this;

		// Loop over listeners (break out when e.stopImmediatePropagation() is called)
		const set = _this.listeners.get(e.type);
		let promises = [];
		if (set) {
			for (const listener of set) {
				const options = _this.listenerOptions.get(listener);
				promises.push(listener.call(this, e));
				if (options && options.once) this.removeEventListener(e.type, listener);
				if (!_event.propagateImmediate) break
			}
		}

		// If this event propagates, dispatch event on parent
		if (_event.propagate && _this.parent) {
			propagatingEvent = e;
			promises.push(_this.parent.dispatchEventAsync(e));
		} else {
			propagatingEvent = null;
		}
		await Promise.all(promises);
	},

	/**
	 * Dispatches an Event to the specified EventTarget, (synchronously) invoking
	 * the affected EventListeners in the appropriate order.
	 *
	 * @param {GameEvent} e - Event to dispatch.
	 * @returns {this} - Returns self for method chaining.
	 */
	dispatchEvent(e) {
		// Prevent duplicate events during propagation
		if (propagatingEvent && propagatingEvent.currentTarget === this) return

		const _this = _eventTargetMixin.get(this);
		const _event = _GameEvent.get(e);

		// Modify event's private properties
		if (_event.target === null) {
			_event.timestamp = performance.now();
			_event.target = this;
		}
		_event.currentTarget = this;

		// Loop over listeners (break out when e.stopImmediatePropagation() is called)
		const set = _this.listeners.get(e.type);
		if (set) {
			for (const listener of set) {
				const options = _this.listenerOptions.get(listener);
				listener.call(this, e);
				if (options && options.once) this.removeEventListener(e.type, listener);
				if (!_event.propagateImmediate) break
			}
		}

		// If this event propagates, dispatch event on parent
		if (_event.propagate && _this.parent) {
			propagatingEvent = e;
			_this.parent.dispatchEvent(e);
		} else {
			propagatingEvent = null;
		}
		return this
	},

	/**
	 * Sets up a function to be called whenever the specified event is dispatched to the target.
	 *
	 * @param {string} type - A case-sensitive string representing the event type to listen for.
	 * @param {function} listener - Function that is called when an event of the specified type occurs.
	 * @param {Object} options - An options object that specifies characteristics about the event listener.
	 *     For now, only "once" is supported, which, if true, would automatically remove the listener when invoked.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEventListener(type, listener, options) {
		const _this = _eventTargetMixin.get(this);
		const set = _this.listeners.has(type) ? _this.listeners.get(type) : new Collection();
		set.add(listener);

		_this.listeners.set(type, set);
		_this.listenerOptions.set(listener, options);
		return this
	},

	/**
	 * Removes from the EventTarget an event listener previously registered with EventTarget.addEventListener().
	 *
	 * @param {string} type - A case-sensitive string representing the event for which to remove an event listener.
	 * @param {function} listener - Event listener function to remove from the event target.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeEventListener(type, listener) {
		const set = _eventTargetMixin.get(this).listeners.get(type);
		if (!set) return
		set.delete(listener);
		return this
	},

	/**
	 * Designates the EventTarget as a source of bubbling events.
	 *
	 * @param {*} child - EventTarget from which events should bubble.
	 * @returns {this} - Returns self for method chaining.
	 */
	propagateEventsFrom(child) {
		const _child = _eventTargetMixin.get(child);
		if (_child) _child.parent = this;
		return this
	},

	/**
	 * Removes the EventTarget as a source of bubbling events.
	 *
	 * @param {*} child - EventTarget from which events should no longer bubble.
	 * @returns {this} - Returns self for method chaining.
	 */
	stopPropagatingFrom(child) {
		const _child = _eventTargetMixin.get(child);
		if (_child && _child.parent === this) _child.parent = null;
		return this
	}
};

const _Collection = new WeakMap();

/**
 * Class that extends Set/Collection to create and access subsets via indexes.
 */
class IndexedCollection extends Collection {
	constructor() {
		super();
		_Collection.set(this, {
			indexed: new Map(),
			indexers: new Map(),
		});
	}

	/**
	 * Creates a subset.
	 *
	 * @param {string} indexName - Key used to identify the subset.
	 * @param {function} indexer - Function that produces an element of the subset.
	 * @returns {this} - Returns self for method chaining.
	 */
	setIndex(indexName, indexer) {
		const _this = _Collection.get(this);

		if (_this.indexers.has(indexName)) return

		_this.indexers.set(indexName, indexer);

		const indexedSet = new Collection();
		this.forEach((item) => {
			const val = indexer(item);
			if (val !== undefined) indexedSet.add(val);
		});

		_this.indexed.set(indexName, indexedSet);

		return this
	}

	/**
	 * Creates a subset.
	 *
	 * @param {string} indexName - Key used to identify the subset.
	 * @returns {Collection} - The subset Collection.
	 */
	getIndexed(indexName) {
		return _Collection.get(this).indexed.get(indexName)
	}

	/**
	 * Removes an item from all subsets.
	 *
	 * @param {*} item - Item to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	unindexItem(item) {
		const map = _Collection.get(this).indexed;
		map.forEach((indexer, key) => {
			map.get(key).delete(item);
		});
		return this
	}

	/**
	 * Removes an item from all subsets. Intended to be called from observing
	 * logic (like a Proxy) or events (like if a component property changes)
	 *
	 * @param {*} item - Item to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	reindexItem(item) {
		const _this = _Collection.get(this);
		this.unindexItem(item); // in case item was already added
		_this.indexers.forEach((indexer, key) => {
			const val = indexer(item);
			if (val !== undefined) _this.indexed.get(key).add(val);
		});
		return this
	}

	/**
	 * Adds an item to the Collection. All indexer functions are run against
	 * each added item so the item is also added to the correct subset.
	 *
	 * @param {*} item - Item to add.
	 * @returns {this} - Returns self for method chaining.
	 */
	add(item) {
		const returnVal = super.add(item);
		this.reindexItem(item);
		return returnVal
	}

	/**
	 * Removes an item from the Collection and all subsets.
	 *
	 * @param {*} item - Item to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	delete(item) {
		this.unindexItem(item);
		return super.delete(item)
	}
}

const _Factory = new WeakMap();

/**
 * A class that serves as a container for synchronous constructors.
 */
class Factory {
	constructor() {
		_Factory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		});
	}

	/**
	 * @param {function} middlewareFunc - Function to be called prior to all constructors.
	 * @returns {this} - Returns self for method chaining.
	 */
	use(middlewareFunc) {
		_Factory.get(this).middleware.add(middlewareFunc);
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {function} construct - Constructor function.
	 * @returns {this} - Returns self for method chaining.
	 */
	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ];
		constructNames.forEach((constructName) => {
			_Factory.get(this).constructors.set(constructName, construct);
		});
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @returns {boolean} - True if the constructor is set, false otherwise.
	 */
	has(constructName) {
		return _Factory.get(this).constructors.has(constructName)
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {Object} data - Data to pass on to the constructor.
	 * @returns {*} - Constructor return value.
	 */
	create(constructName, data) {
		const _this = _Factory.get(this);
		const construct = _this.constructors.get(constructName);
		if (!construct) {
			console.warn(`${constructName} constructor doesn't exist`);
			return
		}
		const middleware = [..._this.middleware];
		data = middleware.reduce((inData, func) => func(constructName, inData), data);
		return construct(constructName, data)
	}
}

const _AsyncFactory = new WeakMap();

/**
 * A class that serves as a container for asynchronous constructors.
 */
class AsyncFactory {
	constructor() {
		_AsyncFactory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		});
	}

	/**
	 * @param {function} middlewareFunc - Async function to be called prior to all constructors.
	 * @returns {this} - Returns self for method chaining.
	 */
	use(middlewareFunc) {
		_AsyncFactory.get(this).middleware.add(middlewareFunc);
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {function} construct - Async constructor function.
	 * @returns {this} - Returns self for method chaining.
	 */
	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ];
		constructNames.forEach((constructName) => {
			_AsyncFactory.get(this).constructors.set(constructName, construct);
		});
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @returns {boolean} - True if the constructor is set, false otherwise.
	 */
	has(constructName) {
		return _AsyncFactory.get(this).constructors.has(constructName)
	}

	/**
	 * @async
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {Object} data - Data to pass on to the constructor.
	 * @returns {*} - Constructor return value.
	 */
	async create(constructName, data) {
		const _this = _AsyncFactory.get(this);
		const construct = _this.constructors.get(constructName);
		if (!construct) {
			console.warn(`${constructName} constructor doesn't exist`);
			return
		}

		const middleware = [..._this.middleware];

		for (const middlewareFunc of middleware) {
			data = await middlewareFunc(constructName, data);
		}

		return await construct(constructName, data)
	}
}

/**
 * Module containing utility functions.
 * @module Utilities
 */

const ADD_PROPS_METHOD_NAME = 'construct';

// Creates a function that "extracts" an object with only the properties that test true
const createExtractObjFunc = test => obj => {
	const extractedObj = {};
	Object.entries(obj).forEach(([key, val]) => {
		if (test(val, key)) extractedObj[key] = val;
	});
	return extractedObj
};

// Extracts an object with only the non-function properties
const extractConstructor = createExtractObjFunc((val, key) => key === ADD_PROPS_METHOD_NAME);

// Extracts an object with only the function properties (methods)
const extractMethods = createExtractObjFunc((val, key) => key !== ADD_PROPS_METHOD_NAME);

/**
 * Returns a function that wraps the given class and applies the provided mixin objects.
 * Ex.
 *     const MixedWithPerson = createMixinFunc(Person)
 *     class Author extends MixedWithPerson(mixin1, mixin2, ...) { ... }
 *
 * @param {function} Clazz - Class to be mixed with.
 * @returns {function} - Function that applies mixins to a new class extending Clazz.
 */
const createMixinFunc = (Clazz) => (...mixins) => {
	const constructors = mixins.map(mixin => extractConstructor(mixin).construct);
	const methodsMixins = mixins.map(mixin => extractMethods(mixin));

	// Add properties to class constructor
	let Mixable;
	if (Clazz)
		Mixable = class extends Clazz {
			constructor(...args) {
				super(...args);
				constructors.forEach(construct => construct.call(this));
			}
		};
	else
		Mixable = class {
			constructor() {
				constructors.forEach(construct => construct.call(this));
			}
		};

	// Add methods to class prototype
	Object.assign(Mixable.prototype, ...methodsMixins);

	return Mixable
};

/**
 * MixedWith provides the ability to add mixins to a class that does not
 * extend a super class.
 *
 * @type {function}
 * @param {...Object} - Mixin objects
 */
const MixedWith = createMixinFunc();

/**
 * Creates nested empty arrays.
 * Ex. createArray(2, 2) === [ [ , ], [ , ] ]
 * @returns {array} - Outermost array.
 */
const createArray = (...args) => {
	if (args.length === 0) return []

	const length = args[0];

	const arr = new Array(length);

	let i = length;
	if (args.length > 1) {
		while(i--) arr[length-1 - i] = createArray(...(args.slice(1)));
	}

	return arr
};

class ObservableChangeEvent extends GameEvent {
	constructor(type, { prop, args } = {}) {
		super(type);
		Object.defineProperty(this, 'prop', { value: prop, writable: false });
		Object.defineProperty(this, 'args', { value: args, writable: false });
	}
}

const handledObjs = new WeakMap();

/**
 * Observable mixin
 *
 * This provides properties and methods used for observing property value
 * changes and/or method calls.
 *
 * @mixin observableMixin
 * @mixes eventTargetMixin
 */
const observableMixin = {
	construct() {
		eventTargetMixin.construct.call(this);
	},

	/**
	 * Observes and dispatches an ObservableChangeEvent each time the specified
	 * property changes or method is called.
	 *
	 * @param {string} prop - Name of property/method to observe.
	 * @returns {this} - Returns self for method chaining.
	 */
	makeObservable(prop) {
		if (!handledObjs.has(this))
			handledObjs.set(this, new Set());
		const handledProps = handledObjs.get(this);

		if (handledProps.has(prop)) return

		let val = this[prop];
		//const descriptor = Reflect.getOwnPropertyDescriptor(this, prop)

		// Observe method calls
		if (typeof val === 'function') {
			Reflect.defineProperty(this, prop, Object.assign({
				get() {
					return (...args) => {
						this.dispatchEvent(new ObservableChangeEvent('observableChange', { prop, args }));
						return val.call(this, ...args)
					}
				},
				set(inVal) { val = inVal; }
			}));

		// Observe property changes
		} else {
			Reflect.defineProperty(this, prop, Object.assign({
				get() { return val },
				set(inVal) {
					this.dispatchEvent(new ObservableChangeEvent('observableChange', { prop, args: [ inVal ] }));
					val = inVal;
				}
			}));
		}
		return this
	},
};

var observableMixin$1 = Object.assign({}, eventTargetMixin, observableMixin)

const _Entity = new WeakMap(); // Store private variables here

/**
 * Class representing an Entity (the "E" in the ECS design pattern).
 * @mixes observableMixin
 */
class Entity extends MixedWith(observableMixin$1) {

	/**
	 * Create an Entity.
	 */
	constructor() {
		super();
		_Entity.set(this, {
			components: new Map()
		});
		this.makeObservable('setComponent');
		this.makeObservable('removeComponent');
	}

	/**
	 * Sets a component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @param  {Object=} component - Plain-data Object.
	 * @returns {this} - Returns self for method chaining.
	 */
	setComponent(compName, component) {
		component.setParentEntity(this);
		_Entity.get(this).components.set(compName, component);
		return this
	}

	/**
	 * Removes a component object from this Entity under the given name (if it exists).
	 * @param  {string} compName - Name of component.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeComponent(compName) {
		_Entity.get(this).components.delete(compName);
		return this
	}

	/**
	 * Gets the component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @returns {Object|null}  Returns the component object under the given name.
	 */
	getComponent(compName) {
		return _Entity.get(this).components.get(compName)
	}

	/**
	 * Check if the given component exists for this Entity.
	 * @param  {string} compName - Name of component.
	 * @returns {boolean}  true if the given component exists for this Entity.
	 */
	hasComponent(compName) {
		return _Entity.get(this).components.has(compName)
	}
}

const _Component = new WeakMap(); // Store private variables here

/**
 * Class representing a Component (the "C" in the ECS design pattern).
 * @mixes observableMixin
 */
class Component extends MixedWith(observableMixin$1) {

	/**
	 * Create a Component.
	 */
	constructor() {
		super();
		_Component.set(this, {
			parentEntity: null
		});
	}

	/**
	 * Gets the Entity to which this Component belongs
	 * @param {Entity} parentEntity - The Entity to which this Component belongs.
	 * @returns {this} - Returns self for method chaining.
	 */
	setParentEntity(parentEntity = null) {
		_Component.get(this).parentEntity = parentEntity;
		return this
	}

	/**
	 * Gets the Entity to which this Component belongs.
	 * @returns {Entity} - Returns the parent Entity.
	 */
	getParentEntity() {
		return _Component.get(this).parentEntity
	}
}

class GameStopEvent extends GameEvent {
	constructor(type) {
		super(type, { bubbles: true });
	}
}

class GameSceneChangeEvent extends GameEvent {
	constructor(type, { sceneName } = {}) {
		super(type, { bubbles: true });
		Object.defineProperty(this, 'sceneName', { value: sceneName, writable: false });
	}
}

class SystemMountedEvent extends GameEvent {
	constructor(type, { entities } = {}) {
		super(type);
		Object.defineProperty(this, 'entities', { value: entities, writable: false });
	}
}

class SystemUpdateEvent extends GameEvent {
	constructor(type, { entities, deltaTime, timestamp } = {}) {
		super(type);
		Object.defineProperty(this, 'entities', { value: entities, writable: false });
		Object.defineProperty(this, 'timestamp', { value: timestamp, writable: false });
		Object.defineProperty(this, 'deltaTime', { value: deltaTime, writable: false });
	}
}

class SystemLoadEvent extends GameEvent {
	constructor(type, { assetFetcher } = {}) {
		super(type);
		Object.defineProperty(this, 'assetFetcher', { value: assetFetcher, writable: false });
	}
}

class SystemLoadedEvent extends GameEvent {
	constructor(type, { assets } = {}) {
		super(type);
		Object.defineProperty(this, 'assets', { value: assets, writable: false });
	}
}

// Creates a function that throws an error when run
const unimplemented = name => () => {
	throw new Error(`${name} not set`)
};

const _System = new WeakMap();

/**
 * Class representing a System.
 * @mixes eventTargetMixin
 */
class System extends MixedWith(eventTargetMixin) {
	constructor() {
		super();
		_System.set(this, {
			getEntitiesFunc: unimplemented('getEntitiesFunc'),
			addEntityFunc: unimplemented('addEntitiesFunc'),
		});
	}

	/**
	 * Primarily used for dependency injection from the parent scene.
	 *
	 * @param {function} func - Function to use when getting entities.
	 * @returns {this} - Returns self for method chaining.
	 */
	setGetEntitiesFunc(func) {
		_System.get(this).getEntitiesFunc = func;
		return this
	}

	/**
	 * Used to remove the injected "getEntitiesFunc" function.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	unsetGetEntitiesFunc() {
		_System.get(this).getEntitiesFunc = unimplemented('getEntitiesFunc');
		return this
	}

	/**
	 * Gets entities using the previously-set "getEntitiesFunc".
	 *
	 * @param {string} indexName - .
	 * @returns {*} - Returned entities.
	 */
	getEntities(indexName) {
		return _System.get(this).getEntitiesFunc(indexName)
	}

	/**
	 * Primarily used for dependency injection from the parent scene.
	 *
	 * @param {function} func - Function to use when adding an entity.
	 * @returns {this} - Returns self for method chaining.
	 */
	setAddEntityFunc(func) {
		_System.get(this).addEntityFunc = func;
		return this
	}

	/**
	 * Used to remove the injected "addEntityFunc" function.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	unsetAddEntityFunc() {
		_System.get(this).addEntityFunc = unimplemented('addEntityFunc');
		return this
	}

	/**
	 * Add an entity using the previously-set "addEntityFunc".
	 *
	 * @param {Entity} entity - The entity to add.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEntity(entity) {
		_System.get(this).addEntityFunc(entity);
		return this
	}

	/**
	 * Fires a bubbling "stopGame" event.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	stopGame() {
		this.dispatchEvent(new GameStopEvent('stopGame'));
		return this
	}

	/**
	 * Fires a bubbling "changeScene" event.
	 *
	 * @param {string} sceneName - Name of the scene to activate
	 * @returns {this} - Returns self for method chaining.
	 */
	changeScene(sceneName) {
		this.dispatchEvent(new GameSceneChangeEvent('changeScene', { sceneName }));
		return this
	}

	/**
	 * Fires a "load" event.
	 *
	 * @async
	 * @param {AssetFetcher} assetFetcher - AssetFetcher to be used in handlers.
	 * @returns {Promise} - Promise that resolves once the load event handler(s) resolve.
	 */
	load(assetFetcher) {
		return this.dispatchEventAsync(new SystemLoadEvent('load', { assetFetcher }))
	}

	/**
	 * Fires a "loaded" event.
	 *
	 * @param {Map} assets - Assets for the system to use.
	  @returns {Promise} - Promise that resolves once the loaded event handler(s) resolve.
	 */
	loaded(assets) {
		return this.dispatchEventAsync(new SystemLoadedEvent('loaded', { assets }))
	}

	/**
	 * Fires a "mounted" event.
	 *
	 * @param {Collection<Entity>} entities - Entities to attach to the event.
	 * @returns {this} - Returns self for method chaining.
	 */
	mounted(entities) {
		this.dispatchEvent(new SystemMountedEvent('mounted', { entities }));
		return this
	}

	/**
	 * Fires an "update" event.
	 *
	 * @param {Collection<Entity>} entities - Entities to attach to the event.
	 * @param {DOMHighResTimeStamp} deltaTime -
	 *     Time since last update in milliseconds to attach to the event.
	 * @param {DOMHighResTimeStamp} timestamp -
	 *     Current time in milliseconds to attach to the event.
	 * @returns {this} - Returns self for method chaining.
	 */
	update(entities, deltaTime, timestamp) {
		this.dispatchEvent(new SystemUpdateEvent('update', { entities, deltaTime, timestamp }));
		return this
	}
}

class SceneLoadEvent extends GameEvent {
	constructor(type, { assetFetcher } = {}) {
		super(type, { bubbles: true });
		Object.defineProperty(this, 'assetFetcher', { value: assetFetcher, writable: false });
	}
}

class SceneLoadedEvent extends GameEvent {
	constructor(type, { assets } = {}) {
		super(type, { bubbles: true });
		Object.defineProperty(this, 'assets', { value: assets, writable: false });
	}
}

class SceneUpdateEvent extends GameEvent {
	constructor(type, { entities, deltaTime } = {}) {
		super(type, { bubbles: true });
		Object.defineProperty(this, 'entities', { value: entities, writable: false });
		Object.defineProperty(this, 'timestamp', { value: deltaTime, writable: false });
	}
}

const _Scene = new WeakMap();

const MAX_UPDATE_RATE = 60 / 1000;

/**
 * Class representing a Scene.
 * @mixes eventTargetMixin
 */
class Scene extends MixedWith(eventTargetMixin) {

	/**
	 * Create a Scene.
	 */
	constructor() {
		super();
		_Scene.set(this, {
			systems: new Map(),
			entities: new IndexedCollection(),
			lastUpdate: null,
		});
	}

	// --------------------------- Entity Management ----------------------------

	/**
	 * Add an entity.
	 *
	 * @param {Entity} entity - Entity to be added.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEntity(entity) {
		if (entity) _Scene.get(this).entities.add(entity);
		return this
	}

	/**
	 * Add entities.
	 *
	 * @param {Entity[]} entities - Iterable containing Entities to be added.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEntities(entities) {
		const innerEntities = _Scene.get(this).entities;
		entities.forEach(entity => innerEntities.add(entity));
		return this
	}

	/**
	 * Remove an entity.
	 *
	 * @param {Entity} entity - Entity to be removed.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeEntity(entity) {
		_Scene.get(this).entities.delete(entity);
		return this
	}

	/**
	 * Checks if an entity was added.
	 *
	 * @param {Entity} entity - Entity to find.
	 * @returns {boolean} - Returns true if the entity was found, false otherwise.
	 */
	hasEntity(entity) {
		return _Scene.get(this).entities.has(entity)
	}

	/**
	 * Checks if the given entity belongs under the associated index.
	 *
	 * @callback Scene~indexer
	 * @param {Entity} - entity to check
	 * @returns {boolean} - True if this entity belongs under the current index.
	 *     False, otherwise
	 */

	/**
	 * Adds an indexer under the given name. When entities are added, they will
	 * be tested against each indexer. Indexed entities can be accessed via
	 * getEntities(indexName).
	 *
	 * @param {string} indexName - Name of the index to add.
	 * @param {Scene~indexer} indexer - Callback function to determine if an entity
	 *     belongs under this index/subset.
	 * @returns {this} - Returns self for method chaining.
	 */
	setEntityIndexer(indexName, indexer) {
		_Scene.get(this).entities.setIndex(indexName, indexer);
		return this
	}

	/**
	 * Re-runs each indexer on the given entity. Primarily useful if values used
	 * in the indexer calculations will change after the entity is added. One
	 * possible use case would be in a setter.
	 *
	 * @param {Entity} entity - Entity to be removed.
	 * @returns {this} - Returns self for method chaining.
	 */
	reindexEntity(entity) {
		_Scene.get(this).entities.reindexItem(entity);
		return this
	}

	/**
	 * Gets the entities under the given index name. If no index name is provided,
	 * this method will return all added entities.
	 *
	 * @param {string} indexName - Name of the index.
	 * @returns {Set<Entity>|Collection<Entity>} - Set object containing the entities.
	 */
	getEntities(indexName) {
		if (indexName === undefined) return _Scene.get(this).entities
		return _Scene.get(this).entities.getIndexed(indexName)
	}


	// --------------------------- System Management ----------------------------

	/**
	 * Adds a system. NOTE: Systems are updated in the order they are added.
	 *
	 * @param {string} systemName - Name of the system to add.
	 * @param {System} system - System to add.
	 * @returns {this} - Returns self for method chaining.
	 */
	setSystem(systemName, system) {
		const _this = _Scene.get(this);
		this.propagateEventsFrom(system);
		system.setGetEntitiesFunc(indexName => this.getEntities(indexName));
		system.setAddEntityFunc(entity => this.addEntity(entity));
		system.mounted(_this.entities);
		_this.systems.set(systemName, system);
		return this
	}

	/**
	 * Removes a system.
	 *
	 * @param {string} systemName - Name of the system to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeSystem(systemName) {
		const _this = _Scene.get(this);
		const system = _this.systems.get(systemName);
		this.stopPropagatingFrom(system);
		system.unsetGetEntitiesFunc();
		system.unsetAddEntityFunc();
		_this.systems.delete(systemName);
		return this
	}

	/**
	 * Removes a system.
	 *
	 * @param {string} systemName - Name of the system to get.
	 * @returns {System|undefined} - Returns self for method chaining.
	 */
	getSystem(systemName) {
		return _Scene.get(this).systems.get(systemName)
	}

	/**
	 * Checks if a system was added.
	 *
	 * @param {string} systemName - Name of the system to find.
	 * @returns {boolean} - Returns true if the system was found, false otherwise.
	 */
	hasSystem(systemName) {
		return _Scene.get(this).systems.has(systemName)
	}


	// --------------------------------------------------------------------------

	/**
	 * Fires a bubbling "stopGame" event.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	stopGame() {
		this.dispatchEvent(new GameStopEvent('stopGame'));
		return this
	}

	/**
	 * Fires a bubbling "changeScene" event.
	 *
	 * @param {string} sceneName - Name of the scene to activate
	 * @returns {this} - Returns self for method chaining.
	 */
	changeScene(sceneName) {
		this.dispatchEvent(new GameSceneChangeEvent('changeScene', { sceneName }));
		return this
	}

	/**
	 * Passes assetFetcher to all systems to load.
	 *
	 * @async
	 * @param {AssetFetcher} assetFetcher - AssetFetcher to be used in handlers.
	 * @returns {Promise} - Promise that resolves once the load/loaded event handler(s) resolve.
	 */
	async load(assetFetcher) {
		const systems = _Scene.get(this).systems;

		// Fire load event for the scene
		await this.dispatchEventAsync(new SceneLoadEvent('load', { assetFetcher }));

		// Fire load events for each system
		systems.forEach(system => system.load(assetFetcher));

		// TODO: Add a "loading" event to be handled like the update event

		// Fetch all assets and pass them back to the systems' loaded method
		const assets = new Map(await assetFetcher.fetchAssets());

		// TODO: Replace this with a keyed collection (Map version of Collection instead of Set)
		const promises = [
			this.dispatchEventAsync(new SceneLoadedEvent('loaded', { assets }))
		];
		systems.forEach(system => promises.push(system.loaded(assets)));

		return Promise.all(promises)
	}

	/**
	 * Calls update() on all systems then fires an "update" event.
	 *
	 * @param {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 * @returns {this} - Returns self for method chaining.
	 */
	update(timestamp) {
		const _this = _Scene.get(this);
		const entities = _this.entities;

		if (_this.lastUpdate === null) _this.lastUpdate = timestamp;

		const deltaTime = timestamp - _this.lastUpdate;

		if (deltaTime === 0 || deltaTime >= MAX_UPDATE_RATE) {
			_this.systems.forEach(system => system.update(entities, deltaTime, timestamp));
			this.dispatchEvent(new SceneUpdateEvent('update', { entities, deltaTime, timestamp }));
			_this.lastUpdate = timestamp;
		}

		return this
	}
}

const _Game = new WeakMap();

/**
 * Class representing a Game.
 * @mixes eventTargetMixin
 */
class Game extends MixedWith(eventTargetMixin) {

	/**
	 * Create a Game Engine.
	 */
	constructor() {
		super();
		const _this = {
			assetFetcher: null,
			sceneFactory: null,
			activeScene: null,
			activeSceneLoaded: false,
			scenes: new Map(),
			running: false,
			stopGameEventListener: () => this.stopGame(),
			changeSceneEventListener: event => this.changeScene(event.sceneName),
		};
		_Game.set(this, _this);

		Object.defineProperty(this, 'running', { get() { return _this.running } });

		// Handle events that bubble up to this class
		this.addEventListener('changeScene', _this.changeSceneEventListener);
		this.addEventListener('stopGame', _this.stopGameEventListener);
	}

	/**
	 * Injects assetFetcher to be used by scenes during load
	 *
	 * @param {AssetFetcher} assetFetcher - AssetFetcher to be used in handlers.
	 * @returns {this} - Returns self for method chaining.
	 */
	setAssetFetcher(assetFetcher) {
		_Game.get(this).assetFetcher = assetFetcher;
		return this
	}

	/**
	 * Injects assetFetcher to be used by scenes during load
	 *
	 * @param {SceneFactory} sceneFactory - AsyncFactory to be used when loading.
	 * @returns {this} - Returns self for method chaining.
	 */
	setSceneFactory(sceneFactory) {
		_Game.get(this).sceneFactory = sceneFactory;
		return this
	}

	/**
	 * Returns the active scene.
	 *
	 * @returns {Scene|undefined} - The active scene, if any.
	 */
	getScene() {
		return _Game.get(this).activeScene
	}

	/**
	 * Changes the active scene using the given name. Fires a "changeScene" event.
	 *
	 * @async
	 * @param {string} sceneName - Type of scene to create.
	 * @returns {this} - Returns self for method chaining.
	 *
	 * @throws - Will throw an error if a scene is not found with the given name.
	 */
	async changeScene(sceneName) {
		const _this = _Game.get(this);

		if (!_this.sceneFactory.has(sceneName))
			throw new Error(`Scene "${sceneName}" doesn't exist`)

		const scene = await _this.sceneFactory.create(sceneName);
		this.propagateEventsFrom(scene);
		_this.activeScene = scene;
		_this.activeSceneLoaded = false;

		// Fires changeScene event (without firing its own listeners)
		this.removeEventListener('changeScene', _this.changeSceneEventListener);
		this.dispatchEvent(new GameSceneChangeEvent('changeScene', { sceneName }));
		this.addEventListener('changeScene', _this.changeSceneEventListener);

		return this
	}

	/**
	 * Starts loading process.
	 *
	 * @async
	 * @param {string=} sceneName - Name used to uniquely identify the scene to find.
	 *
	 * @throws - Will throw an error if a scene is not found with the given name or,
	 *     if no sceneName is provided and there is no active scene.
	 */
	async load(sceneName) {
		const _this = _Game.get(this);
		await this.changeScene(sceneName);

		const scene = _this.activeScene;
		await scene.load(_this.assetFetcher);
		_this.activeSceneLoaded = true;
	}

	/**
	 * Stops the main game loop. Fires a "stopGame" event.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	stopGame() {
		const _this = _Game.get(this);
		_this.running = false;
		this.removeEventListener('stopGame', _this.stopGameEventListener);
		this.dispatchEvent(new GameStopEvent('stopGame'));
		this.removeEventListener('stopGame', _this.stopGameEventListener);
		return this
	}

	/**
	 * Starts the main game loop.
	 *
	 * @param {string=} sceneName - Name used to uniquely identify the scene to find.
	 * @returns {this} - Returns self for method chaining.
	 */
	run(sceneName) {
		const _this = _Game.get(this);
		_this.running = true;

		const main = (timestamp) => {
			if (!_this.running) return
			_this.activeScene.update(timestamp);
			requestAnimationFrame(main);
		};

		const startMain = () => main(performance.now());

		// Run load process if the current scene isn't loaded yet or loading a different scene
		if (!_this.activeSceneLoaded || _this.scenes.get(sceneName) !== _this.activeScene) {
			this.load(sceneName).then(startMain);
		} else {
			startMain();
		}

		return this
	}
}

class FetchProgressEvent extends GameEvent {
	constructor(type, { progress } = {}) {
		super(type, { bubbles: true });
		Object.defineProperty(this, 'progress', { value: progress, writable: false });
	}
}

// -------------------------------------------------------------------------

const IMAGE_EXTENSIONS = Object.freeze(['jpg', 'jpeg', 'gif', 'bmp', 'png', 'tif', 'tiff']);
const AUDIO_EXTENSIONS = Object.freeze(['ogg', 'wav', 'mp3']);
const VIDEO_EXTENSIONS = Object.freeze(['m3u8', 'webm', 'mp4']);

const rejectIfNotOK = response => {
	if(!response.ok) throw new Error('Response not OK')
	return response
};
const fetchOK = (...args) => fetch(...args).then(rejectIfNotOK);
const resolveObj = response => response.json();
const resolveBlob = response => response.blob();
const createBlobResolveFunc = (tagName) => (response) => resolveBlob(response)
	.then((blob) => new Promise((resolve) => {
		const objUrl = URL.createObjectURL(blob);
		const obj = document.createElement(tagName);
		obj.src = objUrl;
		setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
		resolve(obj);
	}));
const resolveImage = createBlobResolveFunc('img');
const resolveAudio = response => response.arrayBuffer();
const resolveVideo = createBlobResolveFunc('video');
const resolveText = response => response.text();

const fetchAsset = (path) => {
	const parts = path.split('.');
	const ext = parts.length !== 0 ? parts[parts.length - 1].toLowerCase() : 'json';

	// Select resolver
	let resolve;
	if (ext === 'json') resolve = resolveObj;
	else if (IMAGE_EXTENSIONS.includes(ext)) resolve = resolveImage;
	else if (AUDIO_EXTENSIONS.includes(ext)) resolve = resolveAudio;
	else if (VIDEO_EXTENSIONS.includes(ext)) resolve = resolveVideo;
	else resolve = resolveText;

	return fetchOK(path).then(resolve)
};

// -------------------------------------------------------------------------

const _AssetFetcher = new WeakMap();

/**
 * Class used to fetch assets.
 * @mixes eventTargetMixin
 */
class AssetFetcher extends MixedWith(eventTargetMixin) {
	constructor() {
		super();
		_AssetFetcher.set(this, {
			queuedAssetPaths: new Set()
		});
	}

	/**
	 * Queue an asset to be fetched.
	 *
	 * @param {string} path - File path/url at which the file may be found.
	 * @returns {this} - Returns self for method chaining.
	 */
	queueAsset(path) {
		if (path) _AssetFetcher.get(this).queuedAssetPaths.add(path);
		return this
	}

	/**
	 * Queue assets to be fetched.
	 *
	 * @param {string[]} [paths = []] - File path/url array at which the files may be found.
	 * @returns {this} - Returns self for method chaining.
	 */
	queueAssets(paths = []) {
		paths.forEach(path => this.queueAsset(path));
		return this
	}

	/**
	 * Fetch all queued assets. On each asset fetch, a "fetchProgress" event
	 * will be dispatched with the current percent complete. (Ex. 0.5 for 50%)
	 *
	 * @returns {Promise<Object[]>} - A promise that resolves when all assets have been fetched.
	 */
	fetchAssets() {
		const paths = [..._AssetFetcher.get(this).queuedAssetPaths];

		let count = 0;
		const dispatchProgressEvent = (val) => {
			count += 1;
			this.dispatchEvent(new FetchProgressEvent('fetchProgress', { progress: count / paths.length }));
			return val
		};
		return Promise.all(
			paths.map(path => fetchAsset(path).then(dispatchProgressEvent).then(asset => [ path, asset ]))
		)
	}

	/**
	 * Fetch an asset, bypassing the queue. Does not dispatch a "fetchProgress" event.
	 *
	 * @param {string} path - File path/url at which the file may be found.
	 * @returns {Promise<*>} - Returns a promise that resolves to the fetched resource.
	 */
	fetch(path) {
		return fetchAsset(path)
	}
}

const defaultData = { tilesets: [], properties: {}, tileWidth: 0, tileHeight: 0 };
class TiledMap {
	constructor() {
		// New object, falling back to defaults
		this.data = Object.assign({}, defaultData);
		this.resources = new Map();
		this.basePath = '';
		this.tileTypes = [];
		this.layers = new Map();
		this.layerCanvases = new Map();
		this.objects = {};
		this.startTime = null;
	}

	get bgm() {
		return this.data.properties && this.data.properties.bgm
	}

	get bgmLoopTarget() {
		return this.data.properties && this.data.properties.bgmLoopTarget
	}

	get tileWidth() {
		return this.data.tilewidth
	}

	get tileHeight() {
		return this.data.tileheight
	}

	getObjects() {
		return this.objects
	}

	decorate(data) {
		this.data = Object.assign({}, defaultData, data);
		return this
	}

	setBasePath(basePath) {
		this.basePath = basePath;
		return this
	}

	getRootRelativePath(path) {
		return (new URL(path, this.basePath)).href
	}

	getResourcePaths() {
		const { tilesets } = this.data;

		// Get tile image paths
		const paths = tilesets.map(({ image }) => image);

		// Get BGM paths
		if (this.bgm) paths.push(this.bgm);

		return this.basePath ?
			paths.map(path => this.getRootRelativePath(path))
			: paths
	}

	getResource(path) {
		path = new URL(path, this.basePath).href;
		return this.resources.get(path)
	}

	setResources(resources) {
		this.resources = new Map(resources);

		// Post-loading setup
		const { data } = this;
		this.initTileTypes(data.tilesets);
		this.initLayers(data.layers);
		this.initLayerCanvases(this.tileWidth, this.tileHeight, this.tileTypes, this.layers);

		return this
	}

	initTileTypes(tilesets) {
		tilesets.forEach((tileset) => {
			const image = this.getResource(tileset.image);
			const yStep = tileset.tileheight + tileset.spacing;
			const xStep = tileset.tilewidth + tileset.spacing;
			const pixelsAcross = tileset.columns * tileset.tilewidth;

			// Each loop, x and y represent the top left corner of each tile in the set
			for(let y = tileset.margin; this.tileTypes.length < tileset.tilecount; y += yStep) {
				for(let x = tileset.margin; x < pixelsAcross; x += xStep) {

					// Create base tile type object
					const obj = { image, x, y, width: tileset.tilewidth, height: tileset.tileheight };

					// Add animation data to the tile type object (if any)
					const extraData = tileset.tiles && tileset.tiles[this.tileTypes.length];
					if(extraData && extraData.animation) {
						let rangeStart = 0;
						let rangeEnd = 0;
						obj.animation = extraData.animation.map((step) => {
							rangeStart = rangeEnd;
							rangeEnd = rangeStart + step.duration;
							return { rangeStart, rangeEnd, tileid: step.tileid }
						});
					}

					// Add tile type to list
					this.tileTypes.push(obj);
				}
			}
		});
	}

	initLayers(layers) {

		// Handle tile layers
		const tileLayers = layers.filter(layer => layer.data && layer.type === 'tilelayer');
		this.layers = new Map(tileLayers.map((layer) => {
			const data = createArray(layer.width, layer.height);
			let idx = 0;

			for(let y = 0, l = layer.height; y < l; y++) {
				for(let x = 0, l2 = layer.width; x < l2; x++) {
					data[x][y] = layer.data[idx++];
				}
			}

			return [ layer.name, { width: layer.width, height: layer.height, data } ]
		}));

		// Handle object layers
		const objectLayers = layers.filter(layer => layer.type === 'objectgroup');
		this.objects = objectLayers.reduce((objects, layer) => {
			layer.objects.forEach((objectData) => {

				// Grab base object properties
				const object = {
					width: objectData.width,
					height: objectData.height,
					x: objectData.x,
					y: objectData.y,
					type: objectData.type || layer.name,
					name: objectData.name
				};

				// Merge properties found in objectData.properties into base object
				Object.assign(object, objectData.properties);
				objects.push(object);
			});
			return objects
		}, []);
	}

	initLayerCanvases(tileWidth, tileHeight, tileTypes, layers) {
		layers = [...layers]; // convert to array
		this.layerCanvases = new Map(
			layers.map(([layerName, layer]) => {
				let canvas = document.createElement('canvas');
				canvas.width = layer.width * tileWidth;
				canvas.height = layer.height * tileHeight;
				let context = canvas.getContext('2d');

				if (layer && layer.data) {
					for (let y = 0, l = layer.height; y < l; y++) {
						for (let x = 0, l2 = layer.width; x < l2; x++) {
							const tileType = tileTypes[layer.data[x][y] - 1];
							const posX = x * tileWidth;
							const posY = y * tileHeight;

							if (tileType && tileType.animation === undefined) {
								context.drawImage(tileType.image,
									tileType.x, tileType.y, tileType.width, tileType.height,
									posX, posY, tileWidth, tileHeight
								);
							}

						}
					}
				}

				return [ layerName, canvas ]
			})
		);
	}

	renderAnimatedTiles(context, layerName, time, tileX1, tileY1, tileX2, tileY2, dX, dY, scaleW, scaleH) {
		const layer = this.layers.get(layerName);

		if (!layer) return

		// Adjust values to ensure we are operating within the layer boundaries
		tileY1 = Math.max(tileY1, 0);
		tileY2 = Math.min(tileY2, layer.height);
		tileX1 = Math.max(tileX1, 0);
		tileX2 = Math.min(tileX2, layer.width);

		// Loop through each tile within the area specified in tileX1, Y1, X2, Y2
		for (let y = tileY1; y < tileY2; y++) {
			for (let x = tileX1; x < tileX2; x++) {
				const tileIdx = layer.data[x][y];
				if (tileIdx === 0) continue

				const posX = (x * this.tileWidth) + dX;
				const posY = (y * this.tileHeight) + dY;

				// If the tile is animated, determine the tile type to be used at this point in time
				let tileType = this.tileTypes[tileIdx - 1];
				if (tileType.animation) {
					const wrappedTime = time % tileType.animation[tileType.animation.length - 1].rangeEnd;
					for (let step of tileType.animation) {
						if (wrappedTime > step.rangeStart && wrappedTime < step.rangeEnd) {
							tileType = this.tileTypes[step.tileid];
							break
						}
					}

					context.drawImage(
						tileType.img,
						tileType.x,
						tileType.y,
						tileType.width,
						tileType.height,
						posX,
						posY,
						this.tileWidth * scaleW,
						this.tileHeight * scaleH
					);

				}
			}
		}

	}

	render(context, layerName, timestamp, sX, sY, sW, sH, dX, dY, dW, dH) {
		// NOTE: May need to use context.getImageData() and .putImageData() for transparency support instead of .drawImage()
		// ...I tried these but they created memory leaks when debugging with Chrome

		this.startTime = this.startTime || timestamp;

		const canvas = this.layerCanvases.get(layerName);

		if (canvas) {

			// Draw static parts of layer
			context.drawImage(canvas, sX, sY, sW, sH, dX, dY, dW, dH);

			// Draw animated parts of layer
			this.renderAnimatedTiles(
				context,
				layerName,
				(timestamp - this.startTime),         // get time since first render (for animation)
				parseInt(sX / this.tileWidth),        // calc x1 in tile units
				parseInt(sY / this.tileHeight),       // calc y1 in tile units
				parseInt(sX + sW) / this.tileWidth,   // calc x2 in tile units
				parseInt(sY + sH) / this.tileHeight,  // calc y2 in tile units
				dX, dY, dW / sW, dH / sH              // destination x, y, scaling-x, scaling-y
			);

		}

	}
}

const keyboardInputs = Symbol();

const wasPressed = Symbol();
const held = Symbol();

class DigitalInput {
	constructor() {
		this[wasPressed] = false;
		this.held = false;
	}

	get held() { return this[held] }
	set held(val) {
		this[held] = val;

		if (val && this[wasPressed]) {
			this[wasPressed] = false;
		}
	}

	get pressed() {
		let held = this.held;
		let pressed = !this[wasPressed] && held;
		this[wasPressed] = held;

		return pressed
	}
}

/* Can probably use something along these lines for analog inputs:
const wasPressed = Symbol()
class AnalogInput {
	constructor() {
		this.value = 0 (may be positive OR negative values)
		this.idleValue = 0
		this.idleThreshold = 20
		this.min = -500
		this.max = 500
		this[wasPressed] = false
	}

	get pressed() {
		let held = this.held
		let pressed = !this[wasPressed] && held
		this[wasPressed] = held

		return pressed
	}

	get held() {
		let idleMin = this.idleValue - this.idleThreshold
		let idleMax = this.idleValue + this.idleThreshold

		return (this.value < idleMin || this.value > idleMax)
	}

	get idle() {
		let idleMin = this.idleValue - this.idleThreshold
		let idleMax = this.idleValue + this.idleThreshold

		return (this.value >= idleMin && this.value <= idleMax)
	}

}
*/

/** Class representing an example input manager. Not intended to be part of final game engine.
 */
class InputManager {
	constructor() {
		this[keyboardInputs] = {
			[32]: new DigitalInput(), // Space Key
			[37]: new DigitalInput(), // Left Arrow
			[39]: new DigitalInput(), // Right Arrow

			[214]: new DigitalInput(), // GamepadLeftThumbstickLeft
			[205]: new DigitalInput(), // GamepadDPadLeft
			[213]: new DigitalInput(), // GamepadLeftThumbstickRight
			[206]: new DigitalInput(), // GamepadDPadRight
			[195]: new DigitalInput()  // A Button
		};

		window.addEventListener('keydown', (event) => {
			let key = this[keyboardInputs][event.keyCode];
			if(key) { key.held = true; }
		}, false);

		window.addEventListener('keyup', (event) => {
			let key = this[keyboardInputs][event.keyCode];
			if(key) { key.held = false; }
		}, false);
	}

	get jumpButton() {
		let key = this[keyboardInputs][195];
		if(key.held) { return key }

		return this[keyboardInputs][32]
	}

	get leftButton() {
		let key = this[keyboardInputs][205];
		if(key.held) { return key }

		key = this[keyboardInputs][214];
		if(key.held) { return key }

		return this[keyboardInputs][37]
	}

	get rightButton() {
		let key = this[keyboardInputs][206];
		if(key.held) { return key }

		key = this[keyboardInputs][213];
		if (key.held) { return key }

		return this[keyboardInputs][39]
	}
}

/**
 * Game namespace.
 * @namespace
 */
const game = {
	Component,

	/**
	 * @returns {Collection} - A new Collection instance.
	 */
	createCollection(...args) {
		return new Collection(...args)
	},

	/**
	 * @returns {IndexedCollection} - A new IndexedCollection instance.
	 */
	createIndexedCollection(...args) {
		return new IndexedCollection(...args)
	},

	/**
	 * @returns {GameEvent} - A new GameEvent instance.
	 */
	createEvent(...args) {
		return new GameEvent(...args)
	},

	/**
	 * @returns {AsyncFactory} - A new AsyncFactory instance.
	 */
	createAsyncFactory(...args) {
		return new AsyncFactory(...args)
	},

	/**
	 * @returns {Factory} - A new Factory instance.
	 */
	createFactory(...args) {
		return new Factory(...args)
	},

	/**
	 * @returns {Entity} - A new Entity instance.
	 */
	createEntity(...args) {
		return new Entity(...args)
	},

	/**
	 * @returns {Component} - A new Component instance.
	 */
	createComponent(...args) {
		return new Component(...args)
	},

	/**
	 * @returns {System} - A new System instance.
	 */
	createSystem(...args) {
		return new System(...args)
	},

	/**
	 * @returns {Scene} - A new Scene instance.
	 */
	createScene(...args) {
		return new Scene(...args)
	},

	/**
	 * @returns {Game} - A new Game instance.
	 */
	createGame(...args) {
		return new Game(...args)
	},

	/**
	 * @returns {AssetFetcher} - A new AssetFetcher instance.
	 */
	createAssetFetcher(...args) {
		return new AssetFetcher(...args)
	},

	/**
	 * @returns {TiledMap} - A new TiledMap instance.
	 */
	createTiledMap(...args) {
		return new TiledMap(...args)
	},

	/**
	 * @returns {InputManager} - A new InputManager instance.
	 */
	createInputManager(...args) {
		return new InputManager(...args)
	},

	/**
	 * @returns {Factory} - A new Factory instance built with a
	 *     middleware function for creating Entities.
	 */
	createEntityFactory(...args) {
		return (new Factory(...args)).use((constructorName, data = {}) =>
			({
				componentFactory: this.createComponentFactory(),
				entity: new Entity(),
				data,
			})
		)
	},

	/**
	 * @returns {Factory} - A new Factory instance built with a
	 *     middleware function for creating Components.
	 */
	createComponentFactory(...args) {
		return (new Factory(...args)).use((constructorName, data = {}) =>
			({ data })
		)
	},

	/**
	 * @returns {Factory} - A new Factory instance built with a
	 *     middleware function for creating Systems.
	 */
	createSystemFactory(...args) {
		return (new AsyncFactory(...args)).use(async (constructorName, data = {}) =>
			({
				system: new System(),
				data,
			})
		)
	},

	/**
	 * @returns {Factory} - A new Factory instance built with a
	 *     middleware function for creating Scenes.
	 */
	createSceneFactory(...args) {
		return (new AsyncFactory(...args)).use(async (constructorName, data = {}) =>
			({
				entityFactory: this.createEntityFactory(),
				systemFactory: this.createSystemFactory(),
				scene: new Scene(),
				data,
			})
		)
	},
};

module.exports = game;
