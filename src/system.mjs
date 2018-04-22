import { MixedWith } from './utilities.mjs'
import { eventTargetMixin } from './gameEvent.mjs'
import GameStopEvent from './events/gameStopEvent.mjs'
import GameSceneChangeEvent from './events/gameSceneChangeEvent.mjs'
import SystemMountedEvent from './events/systemMountedEvent.mjs'
import SystemUpdateEvent from './events/systemUpdateEvent.mjs'
import SystemLoadEvent from './events/systemLoadEvent.mjs'
import SystemLoadedEvent from './events/systemLoadedEvent.mjs'

// Creates a function that throws an error when run
const unimplemented = name => () => {
	throw new Error(`${name} not set`)
}

const _System = new WeakMap()

/**
 * Class representing a System.
 * @mixes eventTargetMixin
 */
class System extends MixedWith(eventTargetMixin) {
	constructor() {
		super()
		_System.set(this, {
			getEntitiesFunc: unimplemented('getEntitiesFunc'),
			addEntityFunc: unimplemented('addEntitiesFunc'),
		})
	}

	/**
	 * Primarily used for dependency injection from the parent scene.
	 *
	 * @param {function} func - Function to use when getting entities.
	 * @returns {this} - Returns self for method chaining.
	 */
	setGetEntitiesFunc(func) {
		_System.get(this).getEntitiesFunc = func
		return this
	}

	/**
	 * Used to remove the injected "getEntitiesFunc" function.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	unsetGetEntitiesFunc() {
		_System.get(this).getEntitiesFunc = unimplemented('getEntitiesFunc')
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
		_System.get(this).addEntityFunc = func
		return this
	}

	/**
	 * Used to remove the injected "addEntityFunc" function.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	unsetAddEntityFunc() {
		_System.get(this).addEntityFunc = unimplemented('addEntityFunc')
		return this
	}

	/**
	 * Add an entity using the previously-set "addEntityFunc".
	 *
	 * @param {Entity} entity - The entity to add.
	 * @returns {this} - Returns self for method chaining.
	 */
	addEntity(entity) {
		_System.get(this).addEntityFunc(entity)
		return this
	}

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
		this.dispatchEvent(new SystemMountedEvent('mounted', {
			indexComponents: (compNames = []) =>
				compNames.forEach(compName =>
					entities.setIndex(compName, entity => entity.getComponent(compName))
				),
			entities
		}))
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
		this.dispatchEvent(new SystemUpdateEvent('update', { entities, deltaTime, timestamp }))
		return this
	}
}

export default System
