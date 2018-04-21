import { MixedWith } from './utilities.mjs'
import { eventTargetMixin } from './gameEvent.mjs'
import GameStopEvent from './events/gameStopEvent.mjs'
import GameSceneChangeEvent from './events/gameSceneChangeEvent.mjs'
import SceneLoadEvent from './events/sceneLoadEvent.mjs'
import SceneLoadedEvent from './events/sceneLoadedEvent.mjs'
import SceneUpdateEvent from './events/sceneUpdateEvent.mjs'
import IndexedCollection from './indexedCollection.mjs'

const _Scene = new WeakMap()

const MAX_UPDATE_RATE = 60 / 1000

/**
 * Class representing a Scene.
 * @mixes eventTargetMixin
 */
class Scene extends MixedWith(eventTargetMixin) {

	/**
	 * Create a Scene.
	 */
	constructor() {
		super()
		_Scene.set(this, {
			systems: new Map(),
			entities: new IndexedCollection(),
			lastUpdate: null,
		})
	}

	// --------------------------- Entity Management ----------------------------

	/**
	 * Add an entity.
	 *
	 * @param {Entity} entity - Entity to be added.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEntity(entity) {
		if (entity) _Scene.get(this).entities.add(entity)
		return this
	}

	/**
	 * Add entities.
	 *
	 * @param {Entity[]} entities - Iterable containing Entities to be added.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEntities(entities) {
		const innerEntities = _Scene.get(this).entities
		entities.forEach(entity => innerEntities.add(entity))
		return this
	}

	/**
	 * Remove an entity.
	 *
	 * @param {Entity} entity - Entity to be removed.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeEntity(entity) {
		_Scene.get(this).entities.delete(entity)
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
		_Scene.get(this).entities.setIndex(indexName, indexer)
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
		_Scene.get(this).entities.reindexItem(entity)
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
		const _this = _Scene.get(this)
		this.propagateEventsFrom(system)
		system.setGetEntitiesFunc(indexName => this.getEntities(indexName))
		system.setAddEntityFunc(entity => this.addEntity(entity))
		system.mounted(_this.entities)
		_this.systems.set(systemName, system)
		return this
	}

	/**
	 * Removes a system.
	 *
	 * @param {string} systemName - Name of the system to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeSystem(systemName) {
		const _this = _Scene.get(this)
		const system = _this.systems.get(systemName)
		this.stopPropagatingFrom(system)
		system.unsetGetEntitiesFunc()
		system.unsetAddEntityFunc()
		_this.systems.delete(systemName)
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
		this.dispatchEvent(new GameStopEvent('stopGame'))
		return this
	}

	/**
	 * Fires a bubbling "changeScene" event.
	 *
	 * @param {string} sceneName - Name of the scene to activate
	 * @returns {this} - Returns self for method chaining.
	 */
	changeScene(sceneName) {
		this.dispatchEvent(new GameSceneChangeEvent('changeScene', { sceneName }))
		return this
	}

	/**
	 * Passes assetFetcher to all systems to load.
	 * Multiple events are dispatched during this process
	 * including 'load', 'fetchProgress' and 'loaded' events
	 *
	 * @async
	 * @param {AssetFetcher} assetFetcher - AssetFetcher to be used in handlers.
	 * @returns {Promise} - Promise that resolves once the load/loaded event handler(s) resolve.
	 */
	async load(assetFetcher) {
		const systems = _Scene.get(this).systems

		// Fire load event for the scene
		await this.dispatchEventAsync(new SceneLoadEvent('load', { assetFetcher }))

		// Fire load events for each system
		systems.forEach(system => system.load(assetFetcher))

		// Temporarily allow fetchProgress events to bubble up through this scene
		this.propagateEventsFrom(assetFetcher)

		// Fetch all assets and pass them back to the systems' loaded method
		const assets = new Map(await assetFetcher.fetchAssets())

		// Stop fetchProgress events from bubbling up throug this scene
		this.stopPropagatingFrom(assetFetcher)

		// TODO: Replace this with a keyed collection (Map version of Collection instead of Set)
		const promises = [
			this.dispatchEventAsync(new SceneLoadedEvent('loaded', { assets }))
		]
		systems.forEach(system => promises.push(system.loaded(assets)))

		return Promise.all(promises)
	}

	/**
	 * Calls update() on all systems then fires an "update" event.
	 *
	 * @param {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 * @returns {this} - Returns self for method chaining.
	 */
	update(timestamp) {
		const _this = _Scene.get(this)
		const entities = _this.entities

		if (_this.lastUpdate === null) _this.lastUpdate = timestamp

		const deltaTime = timestamp - _this.lastUpdate

		if (deltaTime === 0 || deltaTime >= MAX_UPDATE_RATE) {
			_this.systems.forEach(system => system.update(entities, deltaTime, timestamp))
			this.dispatchEvent(new SceneUpdateEvent('update', { entities, deltaTime, timestamp }))
			_this.lastUpdate = timestamp
		}

		return this
	}
}

export default Scene
