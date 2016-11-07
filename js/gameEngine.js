/**
 * GameEngine module.
 * @module Engine
 */
define('GameEngine', function(module) {
	'use strict';

	const AssetUser = require('AssetUser');
	const EntityManager = require('EntityManager');
	const assetManager = new (require('AssetManager'))();
	const TiledMap = require('TiledMap');

	/** Class representing a Game Engine. */
	class GameEngine extends AssetUser {

		/**
		 * Create a Game Engine.
		 * @param {string} mapPath - URL to the map JSON data.
		 * @param {EntityFactory} entityFactory - Instance of an EntityFactory. Used when calling addEntity() method.
		 */
		constructor(mapPath, entityFactory) {
			super();
			this.mapPath = mapPath;
			this.loadingPhase = 0;
			this.runAfterLoad = false;
			this.systems = {};
			this.entityManager = new EntityManager(entityFactory);

			// Queue downloads for overall game....Should this be somehow combined with the addSystems() logic? I copied and edited this logic from there
			let loop = () => {
				let pathsOrObjs = this.getAssetPaths();
				if(!this.loaded) {
					if(pathsOrObjs.length > 0) {
						assetManager.queueDownloads(pathsOrObjs);
					}
					let paths = pathsOrObjs.map(function(pathOrObj) {
						return pathOrObj.path ? pathOrObj.path : pathOrObj; // Ensure each item is a path string
					});

					assetManager.downloadAll(() => {
						let assets = {};
						paths.forEach(function(pathStr) {
							assets[pathStr] = assetManager.getAsset(pathStr);
						});

						this.onAssetsLoaded(assets);

						if(!this.loaded) { loop(); return; }

						this.addSystems();
					});
				}
			};
			loop();

		}

		/**
		 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON)
		 */
		getAssetPaths() {
			switch(this.loadingPhase) {
				case 0:
					return [{
						path: this.mapPath,
						reviver: function(data) {
							return new TiledMap(data);
						}
					}];
				case 1:
					return this.map.getAssetPaths();
			}
		}

		/**
		 * Event handler function - Store downloaded assets
		 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()"
		 */
		onAssetsLoaded(assets) {
			let objects;

			switch(this.loadingPhase) {
				case 0:
					this.map = assets[this.mapPath];
					break;
				case 1:
					this.map.onAssetsLoaded(assets);

					// Create entities for each object type
					objects = this.map.getObjects();
					for(let object of objects) {
						this.addEntity(object.type, object);
					}

					super.onAssetsLoaded();
					break;
			}
			this.loadingPhase++;
		}

		/**
		 * Get an array of Entity instances.
		 * @param  {string=} subsetName - Name of entity subset.
		 * @returns {Entity[]}  Entity instances for this game.
		 */
		getEntities(subsetName) {
			return this.entityManager.getEntities(subsetName);
		}

		/**
		 * Create a subset of the Entity array for this game.
		 * @param  {string} subsetName - Name of component used to get subset.
		 * @param  {function} mapper - Function to help determine if an Entity should be a part of this subset.
		 */
		addEntitySubset(subsetName, mapper) {
			this.entityManager.addEntitySubset(subsetName, mapper);
		}

		/**
		 * Add an Entity.
		 * @param  {string} entityType - Type of Entity to add to this game.
		 * @param {Object} data - Plain object representing the component data.
		 * @returns {Entity}  Entity that was added
		 */
		addEntity(entityType, data) {
			return this.entityManager.addEntity(entityType, data);
		}

		/**
		 * Remove an Entity.
		 * @param {Entity}  entity - Entity instance to be removed
		 */
		removeEntity(entity) {
			this.entityManager.removeEntity(entity);
		}

		/**
		 * Adds a System to this game.
		 * @param {string} systemName - Key to use for the system.
		 * @param {System} system - System to add
		 */
		addSystem(systemName, system) {
			this.systems[systemName] = system;

			let subsets = system.getRequiredSubsets();
			for(let subsetKey in subsets) {
				let mapper = subsets[subsetKey];
				this.addEntitySubset(subsetKey, mapper);
			}

			// Share the same entityManager instance with each system
			system.setEntityManager(this.entityManager);
		}

		/**
		 * Instantiate and add Systems for this game.
		 */
		addSystems() {
			let loop = () => {
				let callbackObjs = [];

				// Queue downloads for each system, keep track of callbacks
				for(let systemKey in this.systems) {
					let system = this.systems[systemKey];
					let pathsOrObjs = system.getAssetPaths();
					if(!system.loaded) {
						if(pathsOrObjs.length > 0) {
							assetManager.queueDownloads(pathsOrObjs);
						}
						callbackObjs.push({
							system: system,
							paths: pathsOrObjs.map(function(pathOrObj) {
								return pathOrObj.path ? pathOrObj.path : pathOrObj; // Ensure each item is a path string
							})
						});
					}
				}

				// Download all queued assets, run callbacks (feed requested assets)
				assetManager.downloadAll(() => {
					let systemsLoaded = true;
					for(let callbackObj of callbackObjs) {

						let assets = {};
						callbackObj.paths.forEach(function(pathStr) {
							assets[pathStr] = assetManager.getAsset(pathStr);
						});

						callbackObj.system.onAssetsLoaded(assets);
						systemsLoaded = systemsLoaded && callbackObj.system.loaded;
					}

					// If any system was not loaded, loop again
					if(!systemsLoaded) { loop(); return; }

					// Otherwise, flag engine as "loaded" and...
					this.loaded = true;

					// *call this.run() if an attempt was made to call this.run() before loading was completed
					if(this.runAfterLoad) { this.run(); }
				});
			};
			loop();
		}

		/**
		 * Fire main loop, which continuously iterates over and runs each System.
		 */
		run() {

			// *If we haven't finished loading, mark a flag to run after load and return
			if(!this.loaded) {
				this.runAfterLoad = true;
				return;
			}

			// Define the main loop function
			let main = (timestamp) => {

				// Loop over systems (ECS design pattern)
				for(let systemKey in this.systems) {
					this.systems[systemKey].run(timestamp);
				}

				// Keep loop going by making an asynchronous, recursive call to main loop function
				window.requestAnimationFrame(main);
			};

			// Run main loop function
			main(performance.now());
		}
	}

	module.exports = GameEngine;
});
