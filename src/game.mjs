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
			assetFetcher: null,
			sceneFactory: null,
			activeScene: null,
			activeSceneLoaded: false,
			scenes: new Map(),
			running: false,
			stopGameEventListener: () => this.stopGame(),
			changeSceneEventListener: event => this.changeScene(event.sceneName),
		}
		_Game.set(this, _this)

		Object.defineProperty(this, 'running', { get() { return _this.running } })

		// Handle events that bubble up to this class
		this.addEventListener('changeScene', _this.changeSceneEventListener)
		this.addEventListener('stopGame', _this.stopGameEventListener)
	}

	/**
	 * Injects assetFetcher to be used by scenes during load
	 *
	 * @param {AssetFetcher} assetFetcher - AssetFetcher to be used in handlers.
	 * @returns {this} - Returns self for method chaining.
	 */
	setAssetFetcher(assetFetcher) {
		_Game.get(this).assetFetcher = assetFetcher
		return this
	}

	/**
	 * Injects assetFetcher to be used by scenes during load
	 *
	 * @param {SceneFactory} sceneFactory - AsyncFactory to be used when loading.
	 * @returns {this} - Returns self for method chaining.
	 */
	setSceneFactory(sceneFactory) {
		_Game.get(this).sceneFactory = sceneFactory
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
		const _this = _Game.get(this)

		if (!_this.sceneFactory.has(sceneName))
			throw new Error(`Scene "${sceneName}" doesn't exist`)

		const scene = await _this.sceneFactory.create(sceneName)
		this.propagateEventsFrom(scene)
		_this.activeScene = scene
		_this.activeSceneLoaded = false

		// Fires changeScene event (without firing its own listeners)
		this.removeEventListener('changeScene', _this.changeSceneEventListener)
		this.dispatchEvent(new GameSceneChangeEvent('changeScene', { sceneName }))
		this.addEventListener('changeScene', _this.changeSceneEventListener)

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
		const _this = _Game.get(this)
		await this.changeScene(sceneName)

		const scene = _this.activeScene
		await scene.load(_this.assetFetcher)
		_this.activeSceneLoaded = true
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
	 */
	run(sceneName) {
		const _this = _Game.get(this)
		_this.running = true

		const main = (timestamp) => {
			if (!_this.running) return
			_this.activeScene.update(timestamp)
			requestAnimationFrame(main)
		}

		const startMain = () => main(performance.now())

		// Run load process if the current scene isn't loaded yet or loading a different scene
		if (!_this.activeSceneLoaded || _this.scenes.get(sceneName) !== _this.activeScene) {
			this.load(sceneName).then(startMain)
		} else {
			startMain()
		}

		return this
	}
}

export default Game
