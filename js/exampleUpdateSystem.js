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
				player: function(entity) {
					return entity.hasComponent('being') && entity.getComponent('being').type === 'Player';
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

			let playerEntities = this.getEntities('player');
			for(let playerEntity of playerEntities) {
				let c = playerEntity.getComponent('physicsBody');
				let state = playerEntity.getComponent('state');
				let sprite = playerEntity.getComponent('sprite');
				if(this.inputManager.leftButton.held) {
					c.accX = -0.3;
					state.state = 'driving';
				} else if(this.inputManager.rightButton.held) {
					c.accX = 0.3;
					state.state = 'driving';
				} else {
					c.accX = 0;
					state.state = 'idle';
				}

				if(state.state === 'driving') {
					let animationTime = 500;
					let time = (timestamp - state.lastUpdate) % animationTime;
					if(time > 100) {
						sprite.frame = Math.max(1, (sprite.frame + 1) % 5);
						state.lastUpdate = timestamp;
					}
				}

				if(this.inputManager.jumpButton.pressed && state.grounded) { c.spdY = -100; }
			}

			this.lastUpdate = timestamp;
		}
	}

	module.exports = ExampleUpdateSystem;
});
