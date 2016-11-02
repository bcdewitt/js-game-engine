/**
 * GameEngine module.
 * @module Engine
 */
define('GameEngine', function(module) {
	'use strict';

	const assetManager = new (require('AssetManager'))();

	/** Class representing a Game Engine. */
	class GameEngine {

		/**
		 * Create a Game Engine.
		 * @param  {string} jsonPath - File path to map .json file.
		 * @param {EntityFactory} entityFactory - Instance of an EntityFactory. Used when calling addEntity() method.
		 */
		constructor(jsonPath, entityFactory) {
			this.loaded = false;
			this.runAfterLoad = false;
			this.entityFactory = entityFactory;
			this.systems = {};
			this.entities = [];
			this.entitySubsets = {};

			// Set up systems
			this.addSystems();
		}

		/**
		 * Get an array of Entity instances.
		 * @param  {string=} subsetName - Name of entity subset.
		 * @returns {Entity[]}  Entity instances for this game.
		 */
		getEntities(subsetName) {
			if(!subsetName) { return this.entities; }
			return this.entitySubsets[subsetName].entities;
		}

		/**
		 * Create a subset of the Entity array for this game.
		 * @param  {string} subsetName - Name of component used to get subset.
		 * @param  {function} mapper - Function to help determine if an Entity should be a part of this subset.
		 */
		addEntitySubset(subsetName, mapper) {
			this.entitySubsets[subsetName] = {
				entities: this.entities.filter(mapper),
				shouldContain: mapper
			};
		}

		/**
		 * Add an Entity.
		 * @param  {string} entityType - Type of Entity to add to this game.
		 * @param {Object} data - Plain object representing the component data.
		 */
		addEntity(entityType, data) {

			let callback = (entity) => {
				for(let subsetKey in this.entitySubsets) {
					let subset = this.entitySubsets[subsetKey];
					if(subset.shouldContain(entity)) {
						subset.entities.push(entity);
					} else {
						let idx = subset.entities.indexOf(entity);
						if(idx !== -1) {
							subset.entities.splice(idx, 1);
						}
					}
				}
			};

			let entityToAdd = this.entityFactory.create(
				entityType,
				data,
				callback
			);

			this.entities.push(entityToAdd);
		}

		/**
		 * Remove an Entity.
		 * @param {Entity}  entity - Entity instance to be removed
		 */
		removeEntity(entity) {
			let handle = (list) => {
				let idx = list.indexOf(entity);
				if(idx !== -1) {
					list.splice(idx, 1);
				}
			};

			// Remove from subset arrays
			for(let subsetKey in this.entitySubsets) {
				let subset = this.entitySubsets[subsetKey];
				handle(subset.entities);
			}

			// Remove from main set array
			handle(this.entities);
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

			system.setEntityGetter((subsetName) => {
				return this.getEntities(subsetName);
			});
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
