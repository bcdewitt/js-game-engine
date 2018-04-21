import { GameEvent } from './gameEvent.mjs'
import Collection from './collection.mjs'
import IndexedCollection from './indexedCollection.mjs'

import Factory from './factory.mjs'
import AsyncFactory from './asyncFactory.mjs'
import Entity from './entity.mjs'
import Component from './component.mjs'
import System from './system.mjs'
import Scene from './scene.mjs'
import Game from './game.mjs'
import AssetFetcher from './assetFetcher.mjs'

import TiledMap from './tiledMap.mjs'
import InputManager from './inputManager.mjs'

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
}

export default game
