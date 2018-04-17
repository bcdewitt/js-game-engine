import { MixedWith } from './utilities.mjs'
import { eventTargetMixin } from './gameEvent.mjs'
import GameStopEvent from './events/gameStopEvent.mjs'
import GameSceneChangeEvent from './events/gameSceneChangeEvent.mjs'

const _Game = new WeakMap()

/**
 * Class representing a Game.
 * @mixes eventTargetMixin
 */
class Game extends MixedWith(eventTargetMixin) {

	/**
	 * Create a Game Engine.
	 */
	constructor() {
		super()
		const _this = {
			activeScene: null,
			scenes: new Map(),
			running: false,
			bubbledEvent: false,
			stopGameEventListener: () => this.stopGame(),
			changeSceneEventListener: event => this.changeScene(event.sceneName),
		}
		_Game.set(this, _this)

		Object.defineProperty(this, 'running', { get() { return _this.running } })

		// Handle events that bubble up to this class
		this.addEventListener('changeScene', _this.changeSceneEventListener)
		this.addEventListener('stopGame', _this.stopGameEventListener)
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
		const _this = _Game.get(this)
		this.propagateEventsFrom(scene)
		_this.scenes.set(sceneName, scene)
		return this
	}

	/**
	 * Remove a scene.
	 *
	 * @param {string} sceneName - Name used to uniquely identify the scene to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeScene(sceneName) {
		_Game.get(this).scenes.delete(sceneName)
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
		const _this = _Game.get(this)
		if (!_this.scenes.has(sceneName))
			throw new Error(`Scene "${sceneName}" doesn't exist`)
		_this.activeScene = _this.scenes.get(sceneName)

		// Fires changeScene event
		this.removeEventListener('changeScene', _this.changeSceneEventListener)
		this.dispatchEvent(new GameSceneChangeEvent('changeScene', { sceneName }))
		this.addEventListener('changeScene', _this.changeSceneEventListener)

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
		const scene = _Game.get(this).activeScene
		return await scene.load(assetFetcher)
	}

	/**
	 * Stops the main game loop. Fires a "stopGame" event.
	 *
	 * @returns {this} - Returns self for method chaining.
	 */
	stopGame() {
		const _this = _Game.get(this)
		_this.running = false
		this.removeEventListener('stopGame', _this.stopGameEventListener)
		this.dispatchEvent(new GameStopEvent('stopGame'))
		this.removeEventListener('stopGame', _this.stopGameEventListener)
		return this
	}

	/**
	 * Starts the main game loop.
	 *
	 * @param {string=} sceneName - Name used to uniquely identify the scene to find.
	 * @returns {this} - Returns self for method chaining.
	 *
	 * @throws - Will throw an error if a scene is not found with the given name or,
	 *     if no sceneName is provided and there is no active scene.
	 */
	run(sceneName) {
		const _this = _Game.get(this)
		_this.running = true

		if (sceneName) this.changeScene(sceneName)
		else if (!_this.activeScene)
			throw new Error('Active scene not set. Use changeScene() method or provide a sceneName to run()')

		const main = (timestamp) => {
			if (!_this.running) return
			_this.activeScene.update(timestamp)
			requestAnimationFrame(main)
		}

		main(performance.now())
		return this
	}
}

export default Game
