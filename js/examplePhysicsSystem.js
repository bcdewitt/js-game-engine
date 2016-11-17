/**
 * ExamplePhysicsSystem module.
 * @module ExamplePhysicsSystem
 */
define('ExamplePhysicsSystem', function(module) {
	'use strict';

	const System = require('System');
	const MAX_SPEED_X = 2.2;
	const MAX_SPEED_Y = 5;
	const GRAVITY = 0.4;
	const FRICTION = 0.15;

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
				staticPhysicsBody: function(entity) {
					return entity.hasComponent('staticPhysicsBody');
				},
				physicsBody: function(entity) {
					return entity.hasComponent('physicsBody');
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
			let deltaTime = timestamp - this.lastUpdate;
			if(this.maxUpdateRate && deltaTime < this.maxUpdateRate) return;

			let staticEntities = this.getEntities('staticPhysicsBody');
			let nonstaticEntities = this.getEntities('physicsBody');

			// For every nonstatic physics body, check for static physics body collision
			for(let nonstaticEntity of nonstaticEntities) {
				let c = nonstaticEntity.getComponent('physicsBody');
				let state = nonstaticEntity.getComponent('state');
				state.grounded = false; // Only set to true after a collision is detected

				c.accY = GRAVITY; // Add gravity (limit to 10)

				// Add acceleration to "speed"
				let time = deltaTime / 10;
				c.spdX = c.spdX + (c.accX / time);
				c.spdY = c.spdY + (c.accY / time);

				// Limit speed
				c.spdX = c.spdX >= 0 ? Math.min(c.spdX, MAX_SPEED_X) : Math.max(c.spdX, MAX_SPEED_X * -1);
				c.spdY = c.spdY >= 0 ? Math.min(c.spdY, MAX_SPEED_Y) : Math.max(c.spdY, MAX_SPEED_Y * -1);

				// Use speed to change position
				c.x += c.spdX;
				c.y += c.spdY;

				for(let staticEntity of staticEntities) {
					let c2 = staticEntity.getComponent('staticPhysicsBody');

					let halfWidthSum = c.halfWidth + c2.halfWidth;
					let halfHeightSum = c.halfHeight + c2.halfHeight;
					let deltaX = c2.midPointX - c.midPointX;
					let deltaY = c2.midPointY - c.midPointY;
					let absDeltaX = Math.abs(deltaX);
					let absDeltaY = Math.abs(deltaY);

					// Collision Detection
					if(
						(halfWidthSum >= absDeltaX) &&
						(halfHeightSum >= absDeltaY)
					) {
						let projectionY = halfHeightSum - absDeltaY; // Value used to correct positioning
						let projectionX = halfWidthSum - absDeltaX;  // Value used to correct positioning

						// Use the lesser of the two projection values
						if(projectionY < projectionX) {
							if(deltaY > 0) projectionY *= -1;
							// alert('move along y axis: ' + projectionY);
							c.y += projectionY; // Apply "projection vector" to rect1
							if(c.spdY > 0 && deltaY > 0) c.spdY = 0;
							if(c.spdY < 0 && deltaY < 0) c.spdY = 0;

							if(projectionY < 0) {
								state.grounded = true;
								if(c.spdX > 0) {
									c.spdX = Math.max(c.spdX - (FRICTION / time), 0);
								} else {
									c.spdX = Math.min(c.spdX + (FRICTION / time), 0);
								}
							}
						} else {
							if(deltaX > 0) projectionX *= -1;
							// alert('move along x axis: ' + projectionX);
							c.x += projectionX; // Apply "projection vector" to rect1
							if(c.spdX > 0 && deltaX > 0) c.spdX = 0;
							if(c.spdX < 0 && deltaX < 0) c.spdX = 0;
						}
					}
				}
			}



			this.lastUpdate = timestamp;
		}
	}

	module.exports = ExamplePhysicsSystem;
});
