'use strict';

// TODO: JSDoc

class Collection extends Set {
	map(func) {
		const newSet = new Collection();
		this.forEach(item => newSet.add(func(item)));
		return newSet
	}

	filter(func) {
		const newSet = new Collection();
		this.forEach(item => { if (func(item)) newSet.add(item); });
		return newSet
	}

	reject(func) {
		return this.filter(item => !func(item))
	}

	reduce(func, defaultVal) {
		if (defaultVal === undefined && this.size === 0)
			throw new Error('reduce() cannot be called on an empty set')

		const iterator = this.values();
		let lastVal = defaultVal === undefined ? iterator.next().value : defaultVal;
		for (const item of iterator) {
			lastVal = func(lastVal, item);
		}
		return lastVal
	}

	some(func) {
		for (const item of this) {
			if (func(item)) return true
		}
		return false
	}

	every(func) {
		for (const item of this) {
			if (!func(item)) return false
		}
		return true
	}

	find(func) {
		for (const item of this) {
			if (func(item)) return item
		}
		return undefined
	}

	concat(iterable) {
		const newSet = new Collection(this); // TODO: Change to make sure we can handle subclasses
		for (const item of iterable) {
			newSet.add(item);
		}
		return newSet
	}
}

const _GameEvent = new WeakMap();
let propagatingEvent = null; // Keeps track of the currently propagating event to cancel out duplicate events

/**
 * Class representing an event fired by a game object.
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

	stopPropagation() {
		_GameEvent.get(this).propagate = false;
	}

	stopImmediatePropagation() {
		const _this = _GameEvent.get(this);
		_this.propagate = false;
		_this.propagateImmediate = false;
	}
}

const _eventTargetMixin = new WeakMap();

/**
 * Event Target mixin
 *
 * This provides properties and methods used for game event handling.
 * It's not meant to be used directly.
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

	// TODO: DRY this up
	async dispatchEventAsync(e) {
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

	addEventListener(type, listener, options) {
		const _this = _eventTargetMixin.get(this);
		const set = _this.listeners.has(type) ? _this.listeners.get(type) : new Collection();
		set.add(listener);

		_this.listeners.set(type, set);
		_this.listenerOptions.set(listener, options);
		return this
	},

	removeEventListener(type, listener) {
		const set = _eventTargetMixin.get(this).listeners.get(type);
		if (!set) return
		set.delete(listener);
		return this
	},

	propagateEventsFrom(child) {
		const _child = _eventTargetMixin.get(child);
		if (_child) _child.parent = this;
		return this
	},

	stopPropagatingFrom(child) {
		const _child = _eventTargetMixin.get(child);
		if (_child && _child.parent === this) _child.parent = null;
		return this
	}
};

// TODO: JSDoc

const unindexItem = (map, item) => {
	map.forEach((indexer, key) => {
		map.get(key).delete(item);
	});
};

const _Collection = new WeakMap();
class IndexedCollection extends Collection {
	constructor() {
		super();
		_Collection.set(this, {
			indexed: new Map(),
			indexers: new Map(),
		});
	}

	// subset filter
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

	// get subset
	getIndexed(indexName) {
		return _Collection.get(this).indexed.get(indexName)
	}

	// Can be called from observing logic (like a Proxy)
	// or events (like if a component property changes)
	reindexItem(item) {
		const _this = _Collection.get(this);
		unindexItem(_this.indexed, item); // in case item was already added
		_this.indexers.forEach((indexer, key) => {
			const val = indexer(item);
			if (val !== undefined) _this.indexed.get(key).add(val);
		});
		return this
	}

	add(item) {
		const returnVal = super.add(item);
		this.reindexItem(item);
		return returnVal
	}

	delete(item) {
		const _this = _Collection.get(this);
		unindexItem(_this.indexed, item);
		return super.delete(item)
	}
}

// TODO: JS Doc

const _Factory = new WeakMap();

class Factory {
	constructor() {
		_Factory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		});
	}

	use(middlewareFunc) {
		_Factory.get(this).middleware.add(middlewareFunc);
		return this
	}

	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ];
		constructNames.forEach((constructName) => {
			_Factory.get(this).constructors.set(constructName, construct);
		});
		return this
	}

	has(constructName) {
		return _Factory.get(this).constructors.has(constructName)
	}

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

// TODO: JS Doc

const _AsyncFactory = new WeakMap();

class AsyncFactory {
	constructor() {
		_AsyncFactory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		});
	}

	use(middlewareFunc) {
		_AsyncFactory.get(this).middleware.add(middlewareFunc);
		return this
	}

	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ];
		constructNames.forEach((constructName) => {
			_AsyncFactory.get(this).constructors.set(constructName, construct);
		});
		return this
	}

	async create(constructName, data) {
		const _this = _AsyncFactory.get(this);
		const construct = _this.constructors.get(constructName);
		const middleware = [..._this.middleware];

		for (const middlewareFunc of middleware) {
			data = await middlewareFunc(constructName, data);
		}

		return await construct(constructName, data)
	}
}

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

// Creates an extendable class that includes the provided mixins
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

const MixedWith = createMixinFunc();

// Creates nested empty arrays
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

var observableMixin = Object.assign({}, eventTargetMixin, {
	construct() {
		eventTargetMixin.construct.call(this);
	},

	makeObservable(prop) {
		if (!handledObjs.has(this))
			handledObjs.set(this, new Set());
		const handledProps = handledObjs.get(this);

		if (handledProps.has(prop)) return

		let val = this[prop];
		const descriptor = Reflect.getOwnPropertyDescriptor(this, prop);

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
			}, descriptor));

		// Observe property changes
		} else {
			Reflect.defineProperty(this, prop, Object.assign({
				get() { return val },
				set(inVal) {
					this.dispatchEvent(new ObservableChangeEvent('observableChange', { prop, args: [ inVal ] }));
					val = inVal;
				}
			}, descriptor));
		}
		return this
	},
})

const _Entity = new WeakMap(); // Store private variables here

/** Class that represents an Entity (the "E" in the ECS design pattern). */
class Entity extends MixedWith(observableMixin) {

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

const getAllObjKeys = (obj) => [... new Set(obj ? Object.keys(obj).concat(
	getAllObjKeys(Object.getPrototypeOf(obj))
) : [])];

const _Component = new WeakMap(); // Store private variables here
const _ProtoChainKeys = new WeakMap(); // Cache object keys from prototype chains

/** Class that represents an Component (the "C" in the ECS design pattern). */
class Component extends MixedWith(observableMixin) {

	/**
	 * Create a Component.
	 * @param {Object} [obj] - Object with properties to assign to this Component
	 */
	constructor(obj) {
		super();
		if (obj) this.decorate(obj);
		_Component.set(this, {
			parentEntity: null
		});
	}

	/**
	 * Decorates an existing object with Component functionality.
	 * @param {Object} [obj] - Object with properties to assign to this Component
	 * @returns {this} - Returns self for method chaining.
	 */
	decorate(obj = {}) {
		const objProto = Reflect.getPrototypeOf(obj);

		let objKeys;
		if (objProto !== Object.prototype) {
			if (!_ProtoChainKeys.has(objProto))
				_ProtoChainKeys.set(objProto, getAllObjKeys(obj));
			objKeys = _ProtoChainKeys.get(objProto);
		} else {
			objKeys = getAllObjKeys(obj);
		}

		objKeys.forEach((key) => {
			Reflect.defineProperty(this, key, {
				enumerable: true,
				get() { return obj[key] },
				set(val) { obj[key] = val; },
			});
		});

		return this
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

/**
 * Class representing a System.
 * @mixes eventTargetMixin
 */
const _System = new WeakMap();
class System extends MixedWith(eventTargetMixin) {
	constructor() {
		super();
		_System.set(this, {
			getEntitiesFunc: unimplemented('getEntitiesFunc'),
			addEntityFunc: unimplemented('addEntitiesFunc'),
		});
	}

	setGetEntitiesFunc(func) {
		_System.get(this).getEntitiesFunc = func;
		return this
	}

	unsetGetEntitiesFunc() {
		_System.get(this).getEntitiesFunc = unimplemented('getEntitiesFunc');
		return this
	}

	getEntities(indexName) {
		return _System.get(this).getEntitiesFunc(indexName)
	}

	setAddEntityFunc(func) {
		_System.get(this).addEntityFunc = func;
		return this
	}

	unsetAddEntityFunc() {
		_System.get(this).addEntityFunc = unimplemented('addEntityFunc');
		return this
	}

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
			activeScene: null,
			scenes: new Map(),
			running: false,
			bubbledEvent: false,
			stopGameEventListener: () => this.stopGame(),
			changeSceneEventListener: event => this.changeScene(event.sceneName),
		};
		_Game.set(this, _this);

		Object.defineProperty(this, 'running', { get() { return _this.running } });

		// Handle events that bubble up to this class
		this.addEventListener('changeScene', _this.changeSceneEventListener);
		this.addEventListener('stopGame', _this.stopGameEventListener);
	}

	// ---------------------------- Scene Management ----------------------------

	/**
	 * Add a scene.
	 *
	 * @param {string} sceneName - Name used to uniquely identify the added scene.
	 * @param {Scene} scene - Scene to add.
	 * @returns {this} - Returns self for method chaining.
	 */
	setScene(sceneName, scene) {
		const _this = _Game.get(this);
		this.propagateEventsFrom(scene);
		_this.scenes.set(sceneName, scene);
		return this
	}

	/**
	 * Remove a scene.
	 *
	 * @param {string} sceneName - Name used to uniquely identify the scene to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeScene(sceneName) {
		_Game.get(this).scenes.delete(sceneName);
		return this
	}

	/**
	 * Checks if a scene was added under the given name.
	 *
	 * @param {string} sceneName - Name used to uniquely identify the scene to find.
	 * @returns {boolean} - Returns true if a scene was found, false otherwise.
	 */
	hasScene(sceneName) {
		return _Game.get(this).scenes.has(sceneName)
	}

	/**
	 * Finds and returns a scene using the given name.
	 *
	 * @param {string} sceneName - Name used to uniquely identify the scene to find.
	 * @returns {Scene|undefined} - Scene found with the given name, if any.
	 */
	getScene(sceneName) {
		if (!sceneName) return _Game.get(this).activeScene
		return _Game.get(this).scenes.get(sceneName)
	}

	/**
	 * Changes the active scene using the given name. Fires a "changeScene" event.
	 *
	 * @param {string} sceneName - Name used to uniquely identify the scene to find.
	 * @returns {this} - Returns self for method chaining.
	 *
	 * @throws - Will throw an error if a scene is not found with the given name.
	 */
	changeScene(sceneName) {
		const _this = _Game.get(this);
		if (!_this.scenes.has(sceneName))
			throw new Error(`Scene "${sceneName}" doesn't exist`)
		_this.activeScene = _this.scenes.get(sceneName);

		// Fires changeScene event
		this.removeEventListener('changeScene', _this.changeSceneEventListener);
		this.dispatchEvent(new GameSceneChangeEvent('changeScene', { sceneName }));
		this.addEventListener('changeScene', _this.changeSceneEventListener);

		return this
	}


	// --------------------------------------------------------------------------

	/**
	 * Passes assetFetcher to active scene and starts loading process.
	 *
	 * @async
	 * @param {AssetFetcher} assetFetcher - AssetFetcher to be used in handlers.
	 * @returns {Promise} - Promise that resolves once the load event handler(s) resolve.
	 */
	async load(assetFetcher) {
		const scene = _Game.get(this).activeScene;
		return await scene.load(assetFetcher)
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
	 * Starts the main game loop
	 *
	 * @param {string=} sceneName - Name used to uniquely identify the scene to find.
	 * @returns {this} - Returns self for method chaining.
	 *
	 * @throws - Will throw an error if a scene is not found with the given name or,
	 *     if no sceneName is provided and there is no active scene.
	 */
	run(sceneName) {
		const _this = _Game.get(this);
		_this.running = true;

		if (sceneName) this.changeScene(sceneName);
		else if (!_this.activeScene)
			throw new Error('Active scene not set. Use changeScene() method or provide a sceneName to run()')

		const main = (timestamp) => {
			if (!_this.running) return
			_this.activeScene.update(timestamp);
			requestAnimationFrame(main);
		};

		main(performance.now());
		return this
	}
}

class FetchProgressEvent extends GameEvent {
	constructor(type, { progress } = {}) {
		super(type, { bubbles: true });
		Object.defineProperty(this, 'progress', { value: progress, writable: false });
	}
}

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

// fetchAsset() - fetches and converts the response into the appropriate type of object
var fetchAsset = (path, callback) => {
	const parts = path.split('.');
	const ext = parts.length !== 0 ? parts[parts.length - 1].toLowerCase() : 'json';

	// Select resolver
	let resolve;
	if (ext === 'json') resolve = resolveObj;
	else if (IMAGE_EXTENSIONS.includes(ext)) resolve = resolveImage;
	else if (AUDIO_EXTENSIONS.includes(ext)) resolve = resolveAudio;
	else if (VIDEO_EXTENSIONS.includes(ext)) resolve = resolveVideo;
	else resolve = resolveText;

	if (callback) {
		const wrappedCallback = val => {
			callback(val);
			return val
		};
		return fetchOK(path).then(resolve).then(wrappedCallback).catch(wrappedCallback)
	}

	return fetchOK(path).then(resolve)
}

const _AssetFetcher = new WeakMap();

/** A class used to fetch assets */
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
	 * will be fired with the current percent complete. (Ex. 0.5 for 50%)
	 *
	 * @returns {Promise<Object[]>} - A promise that resolves when all assets have been fetched.
	 */
	fetchAssets() {
		const paths = [..._AssetFetcher.get(this).queuedAssetPaths];

		let count = 0;
		const dispatchProgressEvent = () => {
			count += 1;
			this.dispatchEvent(new FetchProgressEvent('fetchProgress', { progress: count / paths.length }));
		};
		return Promise.all(
			paths.map(path => fetchAsset(path, dispatchProgressEvent).then(asset => [ path, asset ]))
		)
	}

	/**
	 * Fetch an asset, bypassing the queue.
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
 * Game module.
 * @module Game
 */

/** Object representing the module namespace. */
const namespace = {
	createCollection(...args) {
		return new Collection(...args)
	},

	createIndexedCollection(...args) {
		return new IndexedCollection(...args)
	},

	createEvent(type, options) {
		return new GameEvent(type, options)
	},

	createFactory() {
		return new Factory()
	},

	createEntity() {
		return new Entity()
	},

	createComponent(dataObj) {
		return new Component(dataObj)
	},

	createSystem() {
		return new System()
	},

	createScene() {
		return new Scene()
	},

	createGame() {
		return new Game()
	},

	createAssetFetcher() {
		return new AssetFetcher()
	},

	createTiledMap() {
		return new TiledMap()
	},

	createInputManager() {
		return new InputManager()
	},

	createEntityFactory() {
		return (new Factory()).use((constructorName, data = {}) =>
			({
				componentFactory: this.createComponentFactory(),
				entity: new Entity(),
				data,
			})
		)
	},

	createComponentFactory() {
		return (new Factory()).use((constructorName, data = {}) =>
			({
				component: new Component(),
				data,
			})
		)
	},

	createSystemFactory() {
		return (new AsyncFactory()).use(async (constructorName, data = {}) =>
			({
				system: new System(),
				data,
			})
		)
	},

	createSceneFactory() {
		return (new AsyncFactory()).use(async (constructorName, data = {}) =>
			({
				entityFactory: this.createEntityFactory(),
				systemFactory: this.createSystemFactory(),
				scene: new Scene(),
				data,
			})
		)
	},
};

module.exports = namespace;
