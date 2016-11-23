/**
 * ExampleSpawnerSystem module.
 * @module ExampleSpawnerSystem
 */
define('ExampleSpawnerSystem', function(module) {
	'use strict';

	const System = require('System');

	/** Class representing a particular type of System used for creating entities. Not intended to be part of final game engine.
	 * @extends System
	 */
	class ExampleSpawnerSystem extends System {
		constructor() {
			super();
			this.lastUpdate = null;
		}

		/**
		 * Gets subset info (helps GameEngine with caching).
		 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
		 */
		getRequiredSubsets() {
			return {
				spawner: function(entity) {
					return entity.hasComponent('spawner');
				},
				spawned: function(entity) {
					return entity.hasComponent('spawned');
				}
			};
		}

		/**
		 * Method that is called once per iteration of the main game loop.
		 * Renders map (and, in the future, Entity objects with sprite components).
		 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
		 */
		run(timestamp) {
			this.lastUpdate = this.lastUpdate || timestamp;

			// Get all spawners
			let spawnerEntities = this.getEntities('spawner');

			// Filter to only the spawners that are ready to spawn
			let readySpawners = spawnerEntities.filter((spawnerEntity) => {
				let ready = true;
				let spawnedEntities = this.getEntities('spawned');
				for(let spawnedEntity of spawnedEntities) {
					if(spawnedEntity.getComponent('spawned').spawnerSource === spawnerEntity.getComponent('spawner').name) {
						ready = false;
						break;
					}
				}
				return ready;
			});

			// Create a new spawned entity for each "ready" spawner
			for(let readySpawner of readySpawners) {
				let spawnerComp = readySpawner.getComponent('spawner');

				this.addEntity(spawnerComp.entityType, {
					x: spawnerComp.x,
					y: spawnerComp.y,
					spawnerSource: spawnerComp.name
				});
			}

		}
	}

	module.exports = ExampleSpawnerSystem;
});
