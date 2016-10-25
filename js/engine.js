/**
 * Engine module.
 * @module Engine
 */
define('Engine', function(module) {
	'use strict';

	const TiledMap = require('TiledMap');

	/** Class representing a Game Engine. */
	class Engine {

		/**
		 * Create a Game Engine.
		 * @param  {string} jsonPath - File path to map .json file.
		 * @param {EntityFactory} entityFactory - Instance of an EntityFactory. Used when calling addEntity() method.
		 * @param {function} init - Provides initialization logic. Add systems from within this delegate.
		 */
		constructor(jsonPath, entityFactory, init) {
			this.loaded = false;
			this.initiated = false;
			this.runAfterLoad = false;
			this.entityFactory = entityFactory;
			this.systems = {};
			this.entities = [];
			this.entitySubsets = {};
			this._init = init;

			// Set up map
			this.map = new TiledMap(jsonPath, (objects) => {
				for(let object of objects) {
					this.addEntity(object.type, object);
				}

				this.loaded = true;

				// *call this.run() if an attempt was made to call this.run() before loading was completed
				if(this.runAfterLoad) { this.run(); }
			});
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
		init() {
			this._init();
			this.systems;
			this.initiated = true;
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

			if(!this.initiated) this.init();

			// Define the main loop logic
			let main = (timestamp) => {

				// ECS design pattern
				for(let systemKey in this.systems) {
					this.systems[systemKey].run(timestamp);
				}

				window.requestAnimationFrame(main);
			};

			// Run main loop (wrapper handles loop logic, main)
			main(performance.now());
		}
	}

	module.exports = Engine;
});
