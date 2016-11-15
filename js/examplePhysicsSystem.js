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
			if(this.maxUpdateRate && timestamp - this.lastUpdate < this.maxUpdateRate) return;

			let staticEntities = this.getEntities('staticPhysicsBody');
			let nonstaticEntities = this.getEntities('physicsBody');

			// For every nonstatic physics body, check for static physics body collision
			for(let nonstaticEntity of nonstaticEntities) {
				let sprite = nonstaticEntity.getComponent('sprite');
				let c = nonstaticEntity.getComponent('physicsBody');

				// Positional Logic
				c.forceY = Math.min(c.forceY + 0.4, 10); // Add gravity (limit to 10)

				// Align physics body position and size to sprite (if set)
				if(c.useSprite) {
					sprite.x += c.forceX; // Add forces to position
					sprite.y += c.forceY;
					// TODO: Change "force" logic to better handle acceleration

					c.x = sprite.x;
					c.y = sprite.y;
					c.width = sprite.width;
					c.height = sprite.height;
				} else {
					c.x += c.forceX; // Add forces to position
					c.y += c.forceY;
				}

				for(let staticEntity of staticEntities) {
					let c2 = staticEntity.getComponent('staticPhysicsBody');

					// Collision Detection
					if(
						!(c.x + c.width  < c2.x || c.x > c2.x + c2.width ) && // if not to the left or to the right AND
						!(c.y + c.height < c2.y || c.y > c2.y + c2.height)    // if not above or below
					) {

						// TODO: Now we know there was a collision, we need to check...
						// Get all line intersections from each sprite corner and each of staticEntity's outer edges
							// *The following is similar to a raycasting approach (I didn't like the midpoint/halfwidth idea)
							// y = mx + b,      m = (y - y1) / (x - x1),    b = y - mx   <-- just plug in real x, y and m values
							// *don't run this logic if m === n, this means the lines don't intersect - they are parallel
							// *also, don't forget that these equations are for infinite lines, we will also need to check if the intersection is on the line segment (between the two finite end points)
							// intersection is found by setting x = b - a / m - n, then using our new x value in the line equation to solve for y (store which edge - top, left, bottom, or right)

							// Determine shortest line segment from previous position to intersection and use that
							// a^2 + b^2 = c^2 ===      c = sqrt((intersect.x - prev.x)^2 + (intersect.y - prev.y)^2)

							// Collision Resolution
							// If line hit left edge, place physicsBody at c.x = intersection.x - c.width; c.forceX = 0;
							// If line hit right edge, place physicsBody at c.x = intersection.x; c.forceX = 0;
							// If line hit top edge, place physicsBody at c.y = intersection.y - c.height; c.forceY = 0;
							// If line hit bottom edge, place physicsBody at c.y = intersection.y; c.forceY = 0;
					}
				}
			}

			this.lastUpdate = timestamp;
		}
	}

	module.exports = ExamplePhysicsSystem;
});
