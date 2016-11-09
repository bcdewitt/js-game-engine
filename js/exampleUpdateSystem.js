/**
 * ExampleUpdateSystem module.
 * @module ExampleUpdateSystem
 */
define('ExampleUpdateSystem', function(module) {
	'use strict';

	const InputManager = require('InputManager');
	const System = require('System');

	/** Class representing a particular type of System used for updating entities. Not intended to be part of final game engine.
	 * @extends System
	 */
	class ExampleUpdateSystem extends System {
		constructor() {
			super();
			this.lastUpdate = null;
			this.maxUpdateRate = 60 / 1000;
			this.inputManager = new InputManager();
		}

		/**
		 * Gets subset info (helps GameEngine with caching).
		 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
		 */
		getRequiredSubsets() {
			return {
				camera: function(entity) {
					return entity.hasComponent('camera');
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

			let cameraEntities = this.getEntities('camera');
			for(let cameraEntity of cameraEntities) {
				let c = cameraEntity.getComponent('camera');
				if(this.inputManager.leftArrow) c.mapX -= 1;
				if(this.inputManager.rightArrow) c.mapX += 1;
				if(this.inputManager.upArrow) c.mapY -= 1;
				if(this.inputManager.downArrow) c.mapY += 1;
			}

			this.lastUpdate = timestamp;
			this.inputManager.reset();
		}
	}

	module.exports = ExampleUpdateSystem;
});
