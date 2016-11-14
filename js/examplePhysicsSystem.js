/**
 * ExamplePhysicsSystem module.
 * @module ExamplePhysicsSystem
 */
define('ExamplePhysicsSystem', function(module) {
	'use strict';

	const System = require('System');

	/** Class representing a particular type of System used for applying simple physics to entities. Not intended to be part of final game engine.
	 * @extends System
	 */
	class ExamplePhysicsSystem extends System {
		constructor() {
			super();
			this.lastUpdate = null;
			this.maxUpdateRate = 60 / 1000;
		}

		/**
		 * Gets subset info (helps GameEngine with caching).
		 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
		 */
		getRequiredSubsets() {
			return {
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
			if(this.maxUpdateRate && timestamp - this.lastUpdate < this.maxUpdateRate) return;

			let spawnedEntities = this.getEntities('spawned');
			for(let spawnedEntity of spawnedEntities) {
				let c = spawnedEntity.getComponent('sprite');
				if(c.y < 910) { c.y += 1; }
			}

			this.lastUpdate = timestamp;
		}
	}

	module.exports = ExamplePhysicsSystem;
});
