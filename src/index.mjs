/**
 * Game module.
 * @module Game
 */

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
}

export default namespace
